import type { SellerAnalyticsPeriod } from '@/services/api'
import {
  stableParamsKey,
  type StableQueryParams,
} from '@/lib/react-query/stable-params-key'

export const dashboardQueryKeys = {
  /** Customer + seller + rider order lists share these keys (scoped by `role` param where used). */
  orders: {
    all: ['orders'] as const,
    list: (params?: StableQueryParams) =>
      ['orders', 'list', stableParamsKey(params)] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
  wishlist: {
    all: ['seller', 'wishlist'] as const,
    products: (idsKey: string) => ['seller', 'wishlist', 'products', idsKey] as const,
  },
  analytics: {
    all: ['seller', 'analytics'] as const,
    byPeriod: (period: SellerAnalyticsPeriod) => ['seller', 'analytics', 'period', period] as const,
  },
  seller: {
    all: ['seller'] as const,
    profile: (sellerId: string) => ['seller', 'profile', sellerId] as const,
    dashboardProfile: ['seller', 'dashboard-profile'] as const,
    settingsProfile: ['seller', 'settings-profile'] as const,
    storeProfile: ['seller', 'store-profile'] as const,
    customers: ['seller', 'customers'] as const,
    products: (sellerId: string) => ['seller', 'products', sellerId] as const,
    categories: ['seller', 'product-categories'] as const,
    product: (productId: string) => ['seller', 'product', productId] as const,
    managedProducts: (
      sellerId: string,
      current: number,
      limit: number,
      filtersKey: string,
    ) => ['seller', 'managed-products', sellerId, current, limit, filtersKey] as const,
    managementStats: (sellerId: string) => ['seller', 'management-stats', sellerId] as const,
  },
}
