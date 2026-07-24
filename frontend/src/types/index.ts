// 企业订餐系统类型定义

export interface UserProfile {
  id: string;
  username: string;
  phone: string;
  department: string;
  created_at: string;
}

export interface UserRole {
  user_id: string;
  is_admin: boolean;
}

export type DishCategory = '套餐' | '单品' | '饮品';
export type DishStatus = 'enabled' | 'disabled';

export interface Dish {
  id: string;
  name: string;
  price: number;
  unit: string;
  description: string | null;
  image_url: string | null;
  category: DishCategory;
  status: DishStatus;
  created_at: string;
  updated_at: string;
}

export interface DailyMenu {
  id: string;
  menu_date: string;
  published_at: string | null;
  published_by: string | null;
  created_at: string;
}

export interface DailyMenuItem {
  id: string;
  menu_id: string;
  dish_id: string;
  price_snapshot: number;
  created_at: string;
  dishes?: Dish;
}

export type OrderStatus = 'submitted' | 'confirmed' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  menu_id: string;
  order_date: string;
  status: OrderStatus;
  total: number;
  note: string | null;
  created_at: string;
  user_profiles?: UserProfile;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  dish_id: string | null;
  dish_name_snapshot: string;
  dish_price_snapshot: number;
  quantity: number;
  created_at: string;
}

export interface CartItem {
  dish_id: string;
  dish_name: string;
  dish_price: number;
  unit: string;
  quantity: number;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export interface DailySummaryRow {
  dish_name: string;
  unit: string;
  total_quantity: number;
  total_amount: number;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  submitted: '已 · 呈',
  confirmed: '已 · 准',
  completed: '已 · 毕',
  cancelled: '已 · 撤',
};

// 国风配色下的状态标签样式
export const STATUS_COLOR: Record<OrderStatus, string> = {
  submitted: 'guo-status-submitted',
  confirmed: 'guo-status-confirmed',
  completed: 'guo-status-completed',
  cancelled: 'guo-status-cancelled',
};
