import {
  stableParamsKey,
  type StableQueryParams,
} from '@/lib/react-query/stable-params-key'

export const marketplaceQueryKeys = {
  products: {
    all: ['products'] as const,
    list: (params?: StableQueryParams) =>
      ['products', 'list', stableParamsKey(params)] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    /** Single cache entry for all four home-page shelf queries combined. */
    homeShelves: ['products', 'homeShelves'] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  checkout: {
    buyNow: (productId: string) => ['checkout', 'buyNow', productId] as const,
  },
}
