import { api } from "../http/client";

/** Raw order document from GET /orders (shape varies by populate). */
export type ApiOrder = Record<string, unknown>;

export type OrdersListPagination = Record<string, unknown>;

export type CheckoutShippingAddress = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
};

export type CheckoutPaymentMethod = "cod" | "card" | "jazzcash" | "easypaisa";

export type CheckoutPaymentPayload = {
  method: CheckoutPaymentMethod;
  reference?: string;
};

export type SellerStoreCustomer = {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  lastShippingAddress?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  } | null;
};

export type SellerAnalyticsPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "all";

export type SellerStoreAnalytics = {
  period: SellerAnalyticsPeriod;
  chart: {
    granularity: "day" | "week" | "month" | "year";
    points: { key: string; label: string; revenue: number; orders: number }[];
  };
  summary: {
    totalRevenue: number;
    orderCount: number;
    uniqueCustomers: number;
    unitsSold: number;
    averageOrderValue: number;
  };
  topProducts: {
    productId: string;
    title: string;
    units: number;
    revenue: number;
  }[];
};

export const ordersAPI = {
  list: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ orders: ApiOrder[]; pagination: OrdersListPagination }> => {
    const response = await api.get("/orders", { params });
    const payload = response.data?.data ?? response.data;
    const raw = payload as { orders?: unknown; pagination?: unknown };
    const orders = Array.isArray(raw?.orders)
      ? (raw.orders as ApiOrder[])
      : [];
    return {
      orders,
      pagination: (raw?.pagination ?? {}) as OrdersListPagination,
    };
  },

  cancelOrder: async (orderId: string, reason?: string): Promise<void> => {
    await api.post(`/orders/${orderId}/cancel`, { reason: reason ?? "" });
  },

  listSellerCustomers: async (): Promise<{
    customers: SellerStoreCustomer[];
  }> => {
    const response = await api.get("/orders/seller/customers");
    const payload = response.data?.data ?? response.data;
    const raw = payload as { customers?: unknown };
    const customers = Array.isArray(raw?.customers)
      ? (raw.customers as SellerStoreCustomer[])
      : [];
    return { customers };
  },

  getSellerAnalytics: async (params?: {
    period?: SellerAnalyticsPeriod | string;
  }): Promise<SellerStoreAnalytics> => {
    const response = await api.get("/orders/seller/analytics", {
      params: params?.period ? { period: params.period } : undefined,
    });
    const payload = response.data?.data ?? response.data;
    const raw = payload as Partial<SellerStoreAnalytics>;
    const allowed: SellerAnalyticsPeriod[] = [
      "daily",
      "weekly",
      "monthly",
      "yearly",
      "all",
    ];
    const period = allowed.includes(raw.period as SellerAnalyticsPeriod)
      ? (raw.period as SellerAnalyticsPeriod)
      : "monthly";
    const g = raw.chart?.granularity;
    const granularity =
      g === "day" || g === "week" || g === "month" || g === "year"
        ? g
        : "month";
    return {
      period,
      chart: {
        granularity,
        points: Array.isArray(raw.chart?.points) ? raw.chart!.points : [],
      },
      summary: {
        totalRevenue: raw.summary?.totalRevenue ?? 0,
        orderCount: raw.summary?.orderCount ?? 0,
        uniqueCustomers: raw.summary?.uniqueCustomers ?? 0,
        unitsSold: raw.summary?.unitsSold ?? 0,
        averageOrderValue: raw.summary?.averageOrderValue ?? 0,
      },
      topProducts: Array.isArray(raw.topProducts) ? raw.topProducts : [],
    };
  },

  getById: async (id: string): Promise<{ order: ApiOrder }> => {
    const response = await api.get(`/orders/${id}`);
    const payload = response.data?.data ?? response.data;
    return payload as { order: ApiOrder };
  },

  checkout: async (
    shippingAddress: CheckoutShippingAddress,
    payment?: CheckoutPaymentPayload,
  ): Promise<{ order: ApiOrder }> => {
    const response = await api.post("/orders/checkout", {
      shippingAddress,
      payment,
    });
    const payload = response.data?.data ?? response.data;
    return payload as { order: ApiOrder };
  },

  checkoutBuyNow: async (
    shippingAddress: CheckoutShippingAddress,
    productId: string,
    quantity: number,
    payment?: CheckoutPaymentPayload,
    variantLabel?: string,
  ): Promise<{ order: ApiOrder }> => {
    const response = await api.post("/orders/checkout/buy-now", {
      shippingAddress,
      productId,
      quantity,
      payment,
      ...(variantLabel?.trim() ? { variantLabel: variantLabel.trim() } : {}),
    });
    const payload = response.data?.data ?? response.data;
    return payload as { order: ApiOrder };
  },

  updateStatus: async (
    id: string,
    body: { status?: string; assignedRiderId?: string | null },
  ): Promise<{ order: ApiOrder }> => {
    const response = await api.patch(`/orders/${id}`, body);
    const payload = response.data?.data ?? response.data;
    return payload as { order: ApiOrder };
  },
};
