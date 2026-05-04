/** Top-level order document statuses (aligned with {@link Order} schema). */
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "ready_for_delivery",
  "picked",
  "out_for_delivery",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "partially_refunded",
] as const;

/** Per-line item statuses (aligned with {@link OrderItem} schema). */
export const ORDER_ITEM_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

/** Values accepted by {@link PaymentInfo} `method` in the order schema. */
export const ORDER_PAYMENT_METHODS = [
  "credit_card",
  "debit_card",
  "paypal",
  "stripe",
  "crypto",
  "bank_transfer",
  "cash_on_delivery",
  "dummy",
  "jazzcash",
  "easypaisa",
] as const;

export const ORDER_PAYMENT_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
  "refunded",
  "cancelled",
] as const;
