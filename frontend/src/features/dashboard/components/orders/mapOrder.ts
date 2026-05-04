import { orderDisplayGrandTotal, type LooseRecord } from "@/utils/orderDisplay";
import type { RawOrder, UiOrder } from "./types";

export function mapOrder(o: RawOrder): UiOrder {
  const id = String(o._id ?? o.id ?? "");
  const orderNumber = String(o.orderNumber ?? id);
  const cust = o.customer;
  const customer =
    cust && typeof cust === "object"
      ? [
          (cust as { firstName?: string }).firstName,
          (cust as { lastName?: string }).lastName,
        ]
          .filter(Boolean)
          .join(" ") ||
        String((cust as { email?: string }).email || "") ||
        "Customer"
      : "Customer";
  const items = Array.isArray(o.items)
    ? (o.items as { quantity?: number }[]).reduce(
        (sum, it) => sum + (Number(it.quantity) || 0),
        0,
      )
    : 0;
  const total = orderDisplayGrandTotal(o as LooseRecord);
  const status = String(o.status ?? "pending");
  const date = o.createdAt
    ? new Date(o.createdAt as string).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "";
  return { id, orderNumber, customer, total, status, date, items, raw: o };
}
