// ─── Auth ───────────────────────────────────────────
export type Role = 'admin' | 'employee';

// ─── Customer ───────────────────────────────────────
export interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
}

// ─── Order ──────────────────────────────────────────
export type OrderStatus = 'waiting' | 'done' | 'cancelled';
export type OrderType   = 'pickup' | 'delivery';
export type Location    = 'yavne' | 'ayyanot';
export type PaymentType = 'none' | 'bit' | 'paybox' | 'cash' | 'credit';

export interface OrderItem {
  item_name: string;
  quantity: number;
}

export interface Order {
  id: number;
  shabbat_id: number;
  customer?: Customer;
  is_walk_in: boolean;
  location: Location;
  order_type: OrderType;
  status: OrderStatus;
  payment_type: PaymentType;
  items: OrderItem[];
  total_price: number;
  notes?: string;
  delivery_time?: string;
  delivery_address?: string;
  created_at: string;
}

// ─── Inventory ──────────────────────────────────────
export interface Inventory {
  location: Location;
  jachnun: number;
  jachnun_butter: number;
  kubane: number;
  burekas_cheese: number;
  burekas_potato: number;
  burekas_spinach: number;
  malabi: number;
  orange_juice: number;
  [key: string]: number | Location;
}

// ─── Shabbat ────────────────────────────────────────
export interface Shabbat {
  id: number;
  date: string;
  is_open: boolean;
  yavne_open: boolean;
  ayyanot_open: boolean;
  has_delivery: boolean;
  employees?: string[];
  inventory?: Inventory[];
}

// ─── Redux State ────────────────────────────────────
export interface ShabbatDetail extends Shabbat { orders?: Order[]; }

export interface ShabbatState {
  current: Shabbat | null;
  all: Shabbat[];
  detail: ShabbatDetail | null;
  loading: boolean;
  error: string | null;
}

export interface OrdersState {
  list: Order[];
  loading: boolean;
  error: string | null;
  lastLocalAction: number;
}

export interface CustomersState {
  suggestions: Customer[];
  loading: boolean;
}

export interface RootState {
  shabbat: ShabbatState;
  orders: OrdersState;
  customers: CustomersState;
}
