"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ordersAPI } from "@/services/api";
import { dashboardQueryKeys } from "@/features/dashboard/queries/queryKeys";

export function useOrderCancellation(roleForInvalidate: string) {
  const queryClient = useQueryClient();
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const handleCancelOrder = async (orderId: string) => {
    setCancelSubmitting(true);
    try {
      await ordersAPI.cancelOrder(orderId, cancelReason.trim() || undefined);
      toast.success("Order cancelled successfully.");
      setCancellingOrderId(null);
      setCancelReason("");
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.orders.list({
          role: roleForInvalidate,
        }),
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        (err as { message?: string })?.message ??
        "Failed to cancel order.";
      toast.error(msg);
    } finally {
      setCancelSubmitting(false);
    }
  };

  return {
    cancellingOrderId,
    setCancellingOrderId,
    cancelReason,
    setCancelReason,
    cancelSubmitting,
    handleCancelOrder,
  };
}
