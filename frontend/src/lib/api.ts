import { supabase } from './supabase';
import type {
  Dish,
  DailyMenu,
  DailyMenuItem,
  Order,
  OrderItem,
  UserProfile,
  CartItem,
  SystemConfig,
  DailySummaryRow,
} from '../types';

// ============ 认证 ============
export async function signUp(
  username: string,
  phone: string,
  department: string,
  password: string,
) {
  // 合成邮箱：手机号@yugoo.com（平台 Supabase 关闭了手机短信）
  const email = `${phone}@yugoo.com`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, phone, department },
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn(phone: string, password: string) {
  const email = `${phone}@yugoo.com`;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(cb: (userId: string | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    cb(session?.user?.id ?? null);
  });
}

// ============ 用户 ============
export async function getCurrentProfile(): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .maybeSingle();
  return data;
}

export async function isAdmin(): Promise<boolean> {
  const { data } = await supabase.rpc('is_admin' as never).maybeSingle();
  // rpc returns scalar
  const res = await supabase.rpc('is_admin' as never);
  return res.data === true;
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('is_admin')
    .maybeSingle();
  if (error) return false;
  return data?.is_admin === true;
}

// ============ 菜品 ============
export async function listDishes(): Promise<Dish[]> {
  const { data, error } = await supabase
    .from('dishes')
    .select('*')
    .order('category')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createDish(dish: Partial<Dish>) {
  const { data, error } = await supabase
    .from('dishes')
    .insert(dish)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDish(id: string, patch: Partial<Dish>) {
  const { data, error } = await supabase
    .from('dishes')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDish(id: string) {
  // 软删除：改为禁用
  const { error } = await supabase
    .from('dishes')
    .update({ status: 'disabled' })
    .eq('id', id);
  if (error) throw error;
}

// ============ 每日菜单 ============
export async function getMenuByDate(date: string): Promise<DailyMenu | null> {
  const { data, error } = await supabase
    .from('daily_menus')
    .select('*')
    .eq('menu_date', date)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMenuItems(menuId: string): Promise<DailyMenuItem[]> {
  const { data, error } = await supabase
    .from('daily_menu_items')
    .select('*, dishes(*)')
    .eq('menu_id', menuId);
  if (error) throw error;
  return data ?? [];
}

export async function publishMenu(date: string, dishIds: string[]) {
  const { data, error } = await supabase.rpc('admin_publish_menu', {
    p_menu_date: date,
    p_dish_ids: dishIds,
  });
  if (error) throw error;
  return data;
}

// ============ 订单 ============
export async function placeOrder(
  menuId: string,
  items: CartItem[],
  note: string,
) {
  const payload = items.map((it) => ({
    dish_id: it.dish_id,
    dish_name: it.dish_name,
    dish_price: it.dish_price,
    quantity: it.quantity,
  }));
  const { data, error } = await supabase.rpc('place_order', {
    p_menu_id: menuId,
    p_items: payload,
    p_note: note,
  });
  if (error) throw error;
  return data;
}

export async function listMyOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('order_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listAllOrders(filters: {
  date?: string;
  department?: string;
  status?: string;
}): Promise<Order[]> {
  let q = supabase
    .from('orders')
    .select('*, user_profiles(username, department, phone), order_items(*)')
    .order('order_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters.date) {
    q = q.eq('order_date', filters.date);
  }
  if (filters.status) {
    q = q.eq('status', filters.status);
  }
  if (filters.department) {
    q = q.eq('user_profiles.department', filters.department);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { error } = await supabase.rpc('admin_update_order_status', {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) throw error;
}

// ============ 汇总 ============
export async function getDailySummary(
  date: string,
): Promise<DailySummaryRow[]> {
  const { data, error } = await supabase.rpc('admin_daily_summary', {
    p_date: date,
  });
  if (error) throw error;
  return data ?? [];
}

// ============ 系统配置 ============
export async function getConfig(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('system_config').select('*');
  if (error) throw error;
  const result: Record<string, string> = {};
  (data ?? []).forEach((row: SystemConfig) => {
    result[row.key] = row.value;
  });
  return result;
}

export async function updateConfig(key: string, value: string) {
  const { error } = await supabase.rpc('update_config', {
    p_key: key,
    p_value: value,
  });
  if (error) throw error;
}

// ============ 时间窗判断 ============
export function isWithinTimeWindow(start: string, end: string): boolean {
  const now = new Date();
  const shanghaiOffset = 8 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const localMinutes = (utcMinutes + shanghaiOffset) % (24 * 60);
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  return localMinutes >= startMin && localMinutes <= endMin;
}

// ============ CSV 导出 ============
export function exportOrdersToCsv(orders: Order[]) {
  const headers = ['订单号', '日期', '用户', '部门', '手机号', '状态', '菜品明细', '总价', '备注', '下单时间'];
  const rows = orders.map((o) => {
    const items = (o.order_items ?? [])
      .map((it: OrderItem) => `${it.dish_name_snapshot} x${it.quantity}`)
      .join('; ');
    const statusMap: Record<string, string> = {
      submitted: '已提交',
      confirmed: '已确认',
      completed: '已完成',
      cancelled: '已取消',
    };
    return [
      o.id.slice(0, 8),
      o.order_date,
      o.user_profiles?.username ?? '',
      o.user_profiles?.department ?? '',
      o.user_profiles?.phone ?? '',
      statusMap[o.status] ?? o.status,
      items,
      o.total.toFixed(2),
      o.note ?? '',
      o.created_at,
    ];
  });

  const csvContent =
    '﻿' +
    [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? '');
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
              return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
          })
          .join(','),
      )
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `订单明细_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
