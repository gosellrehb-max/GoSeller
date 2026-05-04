"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrdersList } from "@/features/dashboard/api/orders";
import { dashboardQueryKeys } from "@/features/dashboard/queries/queryKeys";
import type { RawOrder } from "./types";
import { mapOrder } from "./mapOrder";

export function useDashboardOrdersQuery(opts: {
  role: string | undefined;
  isAuthenticated: boolean;
  refetchInterval: number | false;
}) {
  const query = useQuery({
    queryKey: dashboardQueryKeys.orders.list({ role: opts.role ?? "guest" }),
    queryFn: async () => {
      const raw = await getOrdersList();
      return raw.map((o: RawOrder) => mapOrder(o));
    },
    refetchInterval: opts.refetchInterval,
    enabled: opts.isAuthenticated,
  });

  const errorMessage = useMemo(() => {
    if (!query.error) return null;
    const err = query.error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return (
      err?.response?.data?.message ||
      err?.message ||
      "Failed to load orders"
    );
  }, [query.error]);

  return {
    orders: query.data ?? [],
    isLoading: query.isLoading,
    errorMessage,
    refetch: query.refetch,
    queryKeyRole: opts.role ?? "guest",
  };
}
