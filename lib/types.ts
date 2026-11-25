export type Role = "owner" | "admin" | "member" | "viewer";
export type ItemStatus = "pending" | "purchased" | "unavailable" | "cancelled";
export type Priority = "urgent" | "normal" | "optional";

export type Household = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
};

export type Member = {
  household_id: string;
  user_id: string;
  role: Role;
  joined_at: string;
  display_name: string;
};

export type ShoppingItem = {
  id: string;
  household_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimated_price: number | null;
  actual_price: number | null;
  priority: Priority;
  status: ItemStatus;
  notes: string | null;
  added_by: string | null;
  assigned_to: string | null;
  checked_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ShoppingSession = {
  id: string;
  household_id: string;
  shopper_id: string | null;
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

export type Activity = {
  id: string;
  household_id: string;
  actor_id: string | null;
  action: string;
  item_name: string | null;
  created_at: string;
};
