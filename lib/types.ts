export type ItemStatus = "pending" | "purchased" | "unavailable" | "cancelled";
export type Priority = "urgent" | "normal" | "optional";

/** Prices are per quantity unit (e.g. per gram), so total = price × quantity. */
export type ShoppingItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimated_price: number | null;
  actual_price: number | null;
  priority: Priority;
  status: ItemStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ShoppingSession = {
  id: string;
  store_name: string | null;
  payment_method: string | null;
  notes: string | null;
  item_count: number;
  total_estimated: number;
  total_actual: number;
  shopped_at: string;
};

export type SessionItem = {
  id: string;
  session_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimated_price: number | null;
  actual_price: number | null;
};

export type Profile = { name: string };

export type AppState = {
  version: 1;
  profile: Profile;
  items: ShoppingItem[];
  sessions: ShoppingSession[];
  sessionItems: SessionItem[];
};
