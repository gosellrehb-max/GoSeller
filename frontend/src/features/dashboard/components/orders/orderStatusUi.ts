/** Pre-rider-pickup — matches backend cancellable set */
export const CANCELLABLE_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "ready_for_delivery",
] as const;

export function getStatusColor(status: string): string {
  return status === "delivered"
    ? "bg-green-100 text-green-800"
    : status === "out_for_delivery"
      ? "bg-indigo-100 text-indigo-800"
      : ["picked", "ready_for_delivery"].includes(status)
        ? "bg-cyan-100 text-cyan-800"
        : status === "shipped"
          ? "bg-blue-100 text-blue-800"
          : ["processing", "confirmed"].includes(status)
            ? "bg-yellow-100 text-yellow-800"
            : ["cancelled", "refunded", "partially_refunded"].includes(status)
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800";
}

export function formatOrderStatusLabel(s: string): string {
  return s.replace(/_/g, " ");
}
