export type RawOrder = Record<string, unknown>;

export type UiOrder = {
  id: string;
  orderNumber: string;
  customer: string;
  total: number;
  status: string;
  date: string;
  items: number;
  raw: RawOrder;
};

export type CustomerTab = "in_progress" | "delivered" | "cancelled";

export const CUSTOMER_TAB_STATUSES: Record<CustomerTab, string[]> = {
  in_progress: [
    "pending",
    "confirmed",
    "processing",
    "ready_for_delivery",
    "picked",
    "out_for_delivery",
    "shipped",
  ],
  delivered: ["delivered"],
  cancelled: ["cancelled", "refunded", "partially_refunded"],
};

export type AccountNavId = "orders" | "wishlist";
