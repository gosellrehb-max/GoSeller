'use client';

import { useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { CATEGORY_SLUG_MAPPING } from '@/config/categories';
import {
  getProductId,
  type Product,
} from '@/services/api';
import { normalizeProductImages } from '@/utils/productImageUrl';
import { normalizeProductVariants } from '@/utils/productVariants';
import { marketplaceQueryKeys } from '@/features/marketplace/queries/queryKeys';
import { getProductById, getProducts, getHomeShelvesData } from '@/features/marketplace/api/products';

export function useMarketplaceSearchResultsQuery(
  searchQuery: string,
  category?: string,
  minPrice?: number,
  maxPrice?: number,
) {
  const trimmed = searchQuery.trim();
  const baseParams = useMemo(
    () => ({
      limit: 24,
      search: trimmed,
      category: category?.trim() || undefined,
      minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
    [trimmed, category, minPrice, maxPrice],
  );
  const infiniteQuery = useInfiniteQuery({
    queryKey: marketplaceQueryKeys.products.list(baseParams),
    enabled: Boolean(trimmed),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await getProducts({ ...baseParams, page: pageParam as number });
      return res;
    },
    getNextPageParam: (lastPage: any) => {
      const p = lastPage?.pagination;
      const current = Number(p?.current ?? p?.page ?? 1);
      const pages = Number(p?.pages ?? 1);
      return current < pages ? current + 1 : undefined;
    },
  });
  const products = useMemo(
    () =>
      ((infiniteQuery.data?.pages ?? []).flatMap((page: any) =>
        Array.isArray(page?.products) ? (page.products as Product[]) : [],
      ) as Product[]),
    [infiniteQuery.data],
  );
  const firstPage = infiniteQuery.data?.pages?.[0] as any;
  const pagination = firstPage?.pagination ?? { current: 1, pages: 1, total: products.length, limit: 24 };
  return { ...infiniteQuery, products, pagination };
}

export function useMarketplaceCategoryProductsQuery(input: {
  slug: string;
  page: number;
  limit: number;
  sortBy: string;
  minPrice?: number;
  maxPrice?: number;
  enabled?: boolean;
}) {
  const { slug, page, limit, sortBy, minPrice, maxPrice, enabled = true } = input;
  const category = CATEGORY_SLUG_MAPPING[slug as keyof typeof CATEGORY_SLUG_MAPPING];
  const valid = Boolean(category);
  const sortConfig = useMemo(() => {
    if (sortBy === '-price') return { sortBy: 'price', sortOrder: 'desc' as const };
    if (sortBy === 'price') return { sortBy: 'price', sortOrder: 'asc' as const };
    if (sortBy === 'views') return { sortBy: 'views', sortOrder: 'desc' as const };
    if (sortBy === 'createdAt') return { sortBy: 'createdAt', sortOrder: 'desc' as const };
    return { sortBy: 'createdAt', sortOrder: 'desc' as const };
  }, [sortBy]);
  const baseParams = useMemo(
    () => ({
      limit,
      category: category ?? '',
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    }),
    [limit, category, sortConfig, minPrice, maxPrice],
  );

  const infiniteQuery = useInfiniteQuery({
    queryKey: marketplaceQueryKeys.products.list(baseParams),
    enabled: enabled && valid,
    initialPageParam: Math.max(1, page || 1),
    queryFn: async ({ pageParam }) => getProducts({ ...baseParams, page: pageParam as number }),
    getNextPageParam: (lastPage: any) => {
      const p = lastPage?.pagination;
      const current = Number(p?.current ?? p?.page ?? 1);
      const pages = Number(p?.pages ?? 1);
      return current < pages ? current + 1 : undefined;
    },
  });
  const products = useMemo(
    () =>
      ((infiniteQuery.data?.pages ?? []).flatMap((p: any) =>
        Array.isArray(p?.products) ? (p.products as Product[]) : [],
      ) as Product[]),
    [infiniteQuery.data],
  );
  const firstPage = infiniteQuery.data?.pages?.[0] as any;

  const pagination = useMemo(() => {
    const p = firstPage?.pagination as
      | { page?: number; current?: number; limit?: number; total?: number; pages?: number }
      | undefined;
    return {
      page: p?.page ?? p?.current ?? Math.max(1, page || 1),
      limit: p?.limit ?? limit,
      total: p?.total ?? 0,
      pages: p?.pages ?? 1,
    };
  }, [firstPage, page, limit]);

  return {
    ...infiniteQuery,
    validCategory: valid,
    products,
    pagination,
  };
}

export function useMarketplaceProductQuery(productId: string, enabled = true) {
  return useQuery({
    ...getMarketplaceProductDetailQueryOptions(productId),
    enabled: enabled && Boolean(productId),
  });
}

export function getMarketplaceProductDetailQueryOptions(productId: string) {
  return {
    queryKey: marketplaceQueryKeys.products.detail(productId),
    queryFn: async () => {
      const response = await getProductById(productId);
      const p = response.product;
      const images = [p.imageUrl, ...normalizeProductImages(p.images)].filter(
        (url, index, arr): url is string => !!url && arr.indexOf(url) === index,
      );
      return {
        ...p,
        images,
        tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
        specifications: Array.isArray(p.specifications) ? p.specifications : [],
        variants: normalizeProductVariants(p.variants),
      } as Product;
    },
  } as const;
}

export { getProductId };

/**
 * Fetches all four home-page shelves in a single request.
 *
 * staleTime: 5 min  — shelf content changes infrequently; avoids a refetch on every
 *                      tab-focus / route visit while still refreshing during a longer session.
 * gcTime:   15 min  — keep data warm for users who leave the page briefly.
 */
export function useHomeShelves(enabled = true) {
  return useQuery({
    queryKey: marketplaceQueryKeys.products.homeShelves,
    queryFn: getHomeShelvesData,
    enabled,
    staleTime: 5 * 60_000,
    gcTime:   15 * 60_000,
    select: (raw) => ({
      featured:    raw.featured    as Product[],
      discounts:   raw.discounts   as Product[],
      trending:    raw.trending    as Product[],
      newArrivals: raw.newArrivals as Product[],
    }),
  });
}
