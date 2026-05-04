import type { UiOrder } from "./types";

export type OrdersDashboardStats = {
  pending: number;
  inProgress: number;
  delivered: number;
  cancelled: number;
};

export function computeOrdersDashboardStats(orders: UiOrder[]): OrdersDashboardStats {
  const byStatus = new Map<string, number>();
  for (const o of orders) byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1);
  return {
    pending: byStatus.get("pending") ?? 0,
    inProgress:
      (byStatus.get("confirmed") ?? 0) +
      (byStatus.get("processing") ?? 0) +
      (byStatus.get("ready_for_delivery") ?? 0) +
      (byStatus.get("picked") ?? 0) +
      (byStatus.get("out_for_delivery") ?? 0) +
      (byStatus.get("shipped") ?? 0),
    delivered: byStatus.get("delivered") ?? 0,
    cancelled:
      (byStatus.get("cancelled") ?? 0) + (byStatus.get("refunded") ?? 0),
  };
}
