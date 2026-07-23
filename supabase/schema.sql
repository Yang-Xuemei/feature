-- ============================================================
-- 企业订餐系统 - Schema + RLS + RPC
-- Idempotent, non-destructive
-- ============================================================

-- 1. 用户扩展表（业务表，支持 PostgREST join）
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  phone text not null unique,
  department text not null,
  created_at timestamptz not null default now()
);
create index if not exists user_profiles_phone_idx on public.user_profiles(phone);
create index if not exists user_profiles_department_idx on public.user_profiles(department);

-- 2. 用户角色表（identity-layer，直挂 auth.users）
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- 3. 菜品库
create table if not exists public.dishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  unit text not null default '份',
  description text,
  image_url text,
  category text not null check (category in ('套餐','单品','饮品')),
  status text not null default 'enabled' check (status in ('enabled','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists dishes_category_idx on public.dishes(category);
create index if not exists dishes_status_idx on public.dishes(status);

-- 4. 每日菜单（按日期唯一）
create table if not exists public.daily_menus (
  id uuid primary key default gen_random_uuid(),
  menu_date date not null unique,
  published_at timestamptz,
  published_by uuid references public.user_profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists daily_menus_menu_date_idx on public.daily_menus(menu_date);

-- 5. 每日菜单项（含价格快照）
create table if not exists public.daily_menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.daily_menus(id) on delete cascade,
  dish_id uuid not null references public.dishes(id),
  price_snapshot numeric(10,2) not null check (price_snapshot >= 0),
  created_at timestamptz not null default now(),
  unique (menu_id, dish_id)
);
create index if not exists daily_menu_items_menu_id_idx on public.daily_menu_items(menu_id);
create index if not exists daily_menu_items_dish_id_idx on public.daily_menu_items(dish_id);

-- 6. 订单
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.user_profiles(id) on delete cascade,
  menu_id uuid not null references public.daily_menus(id),
  order_date date not null,
  status text not null default 'submitted' check (status in ('submitted','confirmed','completed','cancelled')),
  total numeric(10,2) not null default 0,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, order_date)
);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_menu_id_idx on public.orders(menu_id);
create index if not exists orders_order_date_idx on public.orders(order_date);
create index if not exists orders_status_idx on public.orders(status);

-- 7. 订单项（含菜品快照）
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  dish_id uuid references public.dishes(id),
  dish_name_snapshot text not null,
  dish_price_snapshot numeric(10,2) not null check (dish_price_snapshot >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_items_dish_id_idx on public.order_items(dish_id);

-- 8. 系统配置（单行，订餐时间窗）
create table if not exists public.system_config (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null,
  updated_at timestamptz not null default now()
);

-- 默认时间窗配置
insert into public.system_config (key, value)
values ('order_start_time', '08:00'),
       ('order_end_time', '10:30')
on conflict (key) do nothing;

-- ============================================================
-- 启用 RLS
-- ============================================================
alter table public.user_profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.dishes enable row level security;
alter table public.daily_menus enable row level security;
alter table public.daily_menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.system_config enable row level security;

-- ============================================================
-- 工具函数
-- ============================================================

-- 判断当前用户是否为管理员（只用于其他表的 policy，不用于 user_roles 自身的 policy）
create or replace function public.is_admin()
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  return exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and is_admin = true
  );
end;
$$;

-- ============================================================
-- Trigger：新用户注册 → 创建 user_profiles + user_roles（首用户为管理员）
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  is_first boolean;
begin
  is_first := not exists (select 1 from public.user_roles limit 1);

  insert into public.user_profiles (id, username, phone, department)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'department', '未分配')
  );

  insert into public.user_roles (user_id, is_admin)
  values (new.id, is_first);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RLS Policies
-- ============================================================

-- user_profiles
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'profiles_select_self' and tablename = 'user_profiles') then
    create policy "profiles_select_self" on public.user_profiles
    for select to authenticated
    using ((select auth.uid()) = id or (select public.is_admin()));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'profiles_update_self' and tablename = 'user_profiles') then
    create policy "profiles_update_self" on public.user_profiles
    for update to authenticated
    using ((select auth.uid()) = id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'profiles_insert_self' and tablename = 'user_profiles') then
    create policy "profiles_insert_self" on public.user_profiles
    for insert to authenticated
    with check ((select auth.uid()) = id);
  end if;
end $$;

-- user_roles - 仅允许本人读取自己的角色，管理员管理通过 RPC
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'roles_select_self' and tablename = 'user_roles') then
    create policy "roles_select_self" on public.user_roles
    for select to authenticated
    using ((select auth.uid()) = user_id);
  end if;
end $$;

-- dishes：所有人可读（包含已禁用的，前端过滤），管理员可写
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'dishes_select_all' and tablename = 'dishes') then
    create policy "dishes_select_all" on public.dishes
    for select to authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'dishes_admin_all' and tablename = 'dishes') then
    create policy "dishes_admin_all" on public.dishes
    for all to authenticated
    using ((select public.is_admin()));
  end if;
end $$;

-- daily_menus：所有人可读
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'menus_select_all' and tablename = 'daily_menus') then
    create policy "menus_select_all" on public.daily_menus
    for select to authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'menus_admin_write' and tablename = 'daily_menus') then
    create policy "menus_admin_write" on public.daily_menus
    for all to authenticated
    using ((select public.is_admin()));
  end if;
end $$;

-- daily_menu_items：所有人可读，管理员可写
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'menu_items_select_all' and tablename = 'daily_menu_items') then
    create policy "menu_items_select_all" on public.daily_menu_items
    for select to authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'menu_items_admin_write' and tablename = 'daily_menu_items') then
    create policy "menu_items_admin_write" on public.daily_menu_items
    for all to authenticated
    using ((select public.is_admin()));
  end if;
end $$;

-- orders：用户只能看自己的订单，管理员可看全部
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'orders_select' and tablename = 'orders') then
    create policy "orders_select" on public.orders
    for select to authenticated
    using ((select auth.uid()) = user_id or (select public.is_admin()));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'orders_insert_own' and tablename = 'orders') then
    create policy "orders_insert_own" on public.orders
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'orders_admin_update' and tablename = 'orders') then
    create policy "orders_admin_update" on public.orders
    for update to authenticated
    using ((select public.is_admin()));
  end if;
end $$;

-- order_items：跟随所属订单的可见性
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'order_items_select' and tablename = 'order_items') then
    create policy "order_items_select" on public.order_items
    for select to authenticated
    using (exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = (select auth.uid()) or (select public.is_admin()))
    ));
  end if;
  if not exists (select 1 from pg_policies where policyname = 'order_items_insert_own' and tablename = 'order_items') then
    create policy "order_items_insert_own" on public.order_items
    for insert to authenticated
    with check (exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = (select auth.uid())
    ));
  end if;
end $$;

-- system_config：所有人可读，管理员可写
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'config_select_all' and tablename = 'system_config') then
    create policy "config_select_all" on public.system_config
    for select to authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'config_admin_write' and tablename = 'system_config') then
    create policy "config_admin_write" on public.system_config
    for all to authenticated
    using ((select public.is_admin()));
  end if;
end $$;

-- ============================================================
-- GRANT
-- ============================================================
grant select, insert, update on public.user_profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, update, delete on public.dishes to authenticated;
grant select, insert, update on public.daily_menus to authenticated;
grant select, insert, update, delete on public.daily_menu_items to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select, insert on public.order_items to authenticated;
grant select, update on public.system_config to authenticated;

-- ============================================================
-- RPC：下单（原子化创建订单 + 订单项，含时间窗检查）
-- ============================================================
create or replace function public.place_order(
  p_menu_id uuid,
  p_items jsonb,  -- [{dish_id, dish_name, dish_price, quantity}, ...]
  p_note text default ''
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_menu record;
  v_now time;
  v_start time;
  v_end time;
  v_total numeric(10,2) := 0;
  v_order_id uuid;
  v_item jsonb;
begin
  if v_uid is null then
    raise exception '未登录';
  end if;

  -- 查菜单
  select * into v_menu from public.daily_menus where id = p_menu_id;
  if not found then
    raise exception '菜单不存在';
  end if;
  if v_menu.published_at is null then
    raise exception '菜单未发布';
  end if;

  -- 时间窗检查（使用服务器当前时间）
  v_now := (now() at time zone 'Asia/Shanghai')::time;
  select value::time into v_start from public.system_config where key = 'order_start_time';
  select value::time into v_end from public.system_config where key = 'order_end_time';
  if v_now < v_start or v_now > v_end then
    raise exception '非订餐时段，请在 % - % 之间下单', v_start, v_end;
  end if;

  -- 检查当天是否已有订单
  if exists (
    select 1 from public.orders
    where user_id = v_uid and order_date = v_menu.menu_date and status <> 'cancelled'
  ) then
    raise exception '今日已下单，每天仅允许一次订餐';
  end if;

  -- 计算总价
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_total := v_total + (v_item->>'dish_price')::numeric(10,2) * (v_item->>'quantity')::integer;
  end loop;

  -- 创建订单
  insert into public.orders (user_id, menu_id, order_date, total, note)
  values (v_uid, p_menu_id, v_menu.menu_date, v_total, p_note)
  returning id into v_order_id;

  -- 创建订单项
  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.order_items (order_id, dish_id, dish_name_snapshot, dish_price_snapshot, quantity)
    values (
      v_order_id,
      (v_item->>'dish_id')::uuid,
      v_item->>'dish_name',
      (v_item->>'dish_price')::numeric(10,2),
      (v_item->>'quantity')::integer
    );
  end loop;

  return v_order_id;
end;
$$;

-- ============================================================
-- RPC：管理员更新订单状态
-- ============================================================
create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_status text
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and is_admin = true
  ) then
    raise exception '非管理员';
  end if;
  if p_status not in ('submitted','confirmed','completed','cancelled') then
    raise exception '无效状态';
  end if;
  update public.orders set status = p_status where id = p_order_id;
end;
$$;

-- ============================================================
-- RPC：管理员发布/更新每日菜单
-- ============================================================
create or replace function public.admin_publish_menu(
  p_menu_date date,
  p_dish_ids uuid[]
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_menu_id uuid;
  v_dish_id uuid;
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = v_uid and is_admin = true
  ) then
    raise exception '非管理员';
  end if;

  -- 查询或创建菜单
  select id into v_menu_id from public.daily_menus where menu_date = p_menu_date;
  if not found then
    insert into public.daily_menus (menu_date, published_at, published_by)
    values (p_menu_date, now(), v_uid)
    returning id into v_menu_id;
  else
    update public.daily_menus set published_at = now(), published_by = v_uid
    where id = v_menu_id;
    -- 清除旧项
    delete from public.daily_menu_items where menu_id = v_menu_id;
  end if;

  -- 插入新项（价格快照）
  foreach v_dish_id in array p_dish_ids loop
    insert into public.daily_menu_items (menu_id, dish_id, price_snapshot)
    select v_menu_id, v_dish_id, price
    from public.dishes where id = v_dish_id;
  end loop;

  return v_menu_id;
end;
$$;

-- ============================================================
-- RPC：当日汇总
-- ============================================================
create or replace function public.admin_daily_summary(p_date date)
returns table (
  dish_name text,
  unit text,
  total_quantity bigint,
  total_amount numeric
)
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and is_admin = true
  ) then
    raise exception '非管理员';
  end if;

  return query
  select
    oi.dish_name_snapshot as dish_name,
    d.unit,
    sum(oi.quantity)::bigint as total_quantity,
    sum(oi.dish_price_snapshot * oi.quantity) as total_amount
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  left join public.dishes d on d.id = oi.dish_id
  where o.order_date = p_date and o.status <> 'cancelled'
  group by oi.dish_name_snapshot, d.unit
  order by total_quantity desc;
end;
$$;

-- ============================================================
-- RPC：更新系统配置
-- ============================================================
create or replace function public.update_config(p_key text, p_value text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and is_admin = true
  ) then
    raise exception '非管理员';
  end if;
  insert into public.system_config (key, value, updated_at)
  values (p_key, p_value, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
end;
$$;

-- ============================================================
-- GRANT RPC
-- ============================================================
grant execute on function public.place_order(uuid, jsonb, text) to authenticated;
grant execute on function public.admin_update_order_status(uuid, text) to authenticated;
grant execute on function public.admin_publish_menu(date, uuid[]) to authenticated;
grant execute on function public.admin_daily_summary(date) to authenticated;
grant execute on function public.update_config(text, text) to authenticated;
grant execute on function public.is_admin() to authenticated;
