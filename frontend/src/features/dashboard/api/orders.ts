import { ordersAPI } from "@/services/api";
import type { LooseRecord } from "@/utils/orderDisplay";
import type { SellerStoreCustomer } from "@/services/api";
import {
  productsAPI,
  type Product,
  type SellerAnalyticsPeriod,
  type SellerStoreAnalytics,
} from "@/services/api";

export async function getMyOrders(): Promise<LooseRecord[]> {
  const response = await ordersAPI.list({ page: 1, limit: 50 });
  return (response.orders ?? []) as LooseRecord[];
}

export async function updateOrderStatus(input: {
  id: string;
  status: string;
}): Promise<void> {
  await ordersAPI.updateStatus(input.id, { status: input.status });
}

export async function getSellerCustomers(): Promise<SellerStoreCustomer[]> {
  const { customers } = await ordersAPI.listSellerCustomers();
  return customers;
}

export async function getOrdersList(): Promise<LooseRecord[]> {
  const result = await ordersAPI.list({ page: 1, limit: 50 });
  return (result.orders ?? []) as LooseRecord[];
}

export async function getWishlistProductsByIds(
  ids: string[],
): Promise<{ id: string; product: Product }[]> {
  const promises = ids.slice(0, 50).map(async (id) => {
    try {
      const { product } = await productsAPI.getById(id);
      return product ? { id, product } : null;
    } catch {
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((r): r is NonNullable<typeof r> => r !== null);
}

export async function getSellerAnalytics(input: {
  period: SellerAnalyticsPeriod;
}): Promise<SellerStoreAnalytics> {
  return ordersAPI.getSellerAnalytics(input);
}
