'use client';

import React from 'react'
import Link from 'next/link'
import { type Product, getProductId } from '@/services/api'
import { resolveProductPrimaryImage } from '@/utils/productImageUrl'
import {
  PRODUCT_CARD_DETAILED_TITLE_CLASSNAME,
  productCardListingHeadline,
} from '@/utils/productDetailedTitle'
import { PriceWithSmallRs } from '@/features/product/components/PriceWithSmallRs'
import NoResultsReturnHome from '@/features/marketplace/components/NoResultsReturnHome'
import StorefrontFooter from '@/components/layout/StorefrontFooter'
import { useQueryClient } from '@tanstack/react-query'
import {
  getMarketplaceProductDetailQueryOptions,
  useMarketplaceSearchResultsQuery,
} from '@/features/marketplace/hooks/useMarketplaceQueries'

export default function MarketplaceSearchResultsView({ query }: { query: string }) {
  const queryClient = useQueryClient()
  const sentinelRef = React.useRef<HTMLDivElement | null>(null)
  const hasNextPageRef = React.useRef(false)
  const isFetchingNextPageRef = React.useRef(false)
  const fetchNextPageRef = React.useRef<(() => Promise<unknown>) | null>(null)
  const trimmed = query.trim()
  const [minPriceInput, setMinPriceInput] = React.useState('')
  const [maxPriceInput, setMaxPriceInput] = React.useState('')
  const [appliedMinPrice, setAppliedMinPrice] = React.useState<number | undefined>(undefined)
  const [appliedMaxPrice, setAppliedMaxPrice] = React.useState<number | undefined>(undefined)
  const applyPriceFilter = React.useCallback(() => {
    const min = minPriceInput.trim() === '' ? undefined : Number(minPriceInput)
    const max = maxPriceInput.trim() === '' ? undefined : Number(maxPriceInput)
    setAppliedMinPrice(Number.isFinite(min) ? min : undefined)
    setAppliedMaxPrice(Number.isFinite(max) ? max : undefined)
  }, [minPriceInput, maxPriceInput])
  const clearPriceFilter = React.useCallback(() => {
    setMinPriceInput('')
    setMaxPriceInput('')
    setAppliedMinPrice(undefined)
    setAppliedMaxPrice(undefined)
  }, [])
  const {
    products,
    pagination,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMarketplaceSearchResultsQuery(trimmed, undefined, appliedMinPrice, appliedMaxPrice)

  React.useEffect(() => {
    hasNextPageRef.current = Boolean(hasNextPage)
    isFetchingNextPageRef.current = isFetchingNextPage
    fetchNextPageRef.current = fetchNextPage
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  React.useEffect(() => {
    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (!first?.isIntersecting) return
        if (!hasNextPageRef.current) return
        if (isFetchingNextPageRef.current) return
        void fetchNextPageRef.current?.()
      },
      { root: null, rootMargin: '300px 0px', threshold: 0.01 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const uniqueProducts = React.useMemo(() => {
    const seen = new Set<string>()
    return products.filter((p) => {
      const id = getProductId(p)
      const key = id || String((p as any).slug ?? '')
      if (!key) return true
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [products])

  const prefetchProductDetail = React.useCallback(
    (id: string) => {
      void queryClient.prefetchQuery(getMarketplaceProductDetailQueryOptions(id))
    },
    [queryClient],
  )

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-white flex flex-col">
      {children}
      <StorefrontFooter />
    </div>
  )

  if (isLoading) {
    return shell(
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-wm-muted text-sm">Searching…</p>
        </div>
      </main>,
    )
  }

  if (!trimmed || uniqueProducts.length === 0) {
    return shell(
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <NoResultsReturnHome term={trimmed || query} embedded />
      </main>,
    )
  }

  return shell(
    <>
      <div className="border-b border-wm-border bg-white shrink-0">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 px-4 py-4 sm:px-6">
          <h1 className="text-center text-base font-bold text-wm-ink sm:text-lg">Results for &ldquo;{trimmed}&rdquo;</h1>
        </div>
      </div>
      <main className="mx-auto max-w-6xl flex-1 w-full px-4 py-8 sm:px-6">
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Min price</label>
            <input
              type="number"
              min="0"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max price</label>
            <input
              type="number"
              min="0"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="10000"
            />
          </div>
          <button
            type="button"
            onClick={applyPriceFilter}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={clearPriceFilter}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
        <div className="mb-4 text-sm font-semibold text-gray-900">{pagination.total} products found</div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {uniqueProducts.map((p) => {
            const id = getProductId(p)
            const img = resolveProductPrimaryImage(p)
            const headline = productCardListingHeadline(p)
            const [srDollars, srCents] = Number(p.price).toFixed(2).split('.')
            return (
              <li key={id || headline}>
                <Link
                  href={id ? `/product/${id}` : '#'}
                  onMouseEnter={() => {
                    if (!id) return
                    prefetchProductDetail(id)
                  }}
                  onFocus={() => {
                    if (!id) return
                    prefetchProductDetail(id)
                  }}
                  className="block overflow-hidden rounded-lg border border-wm-border bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="aspect-square bg-[#f3f3f3]">{img ? <img src={img} alt={headline} className="h-full w-full object-cover" /> : null}</div>
                  <div className="p-2.5">
                    <p className={PRODUCT_CARD_DETAILED_TITLE_CLASSNAME} title={headline}>{headline}</p>
                    <div className="mt-1"><PriceWithSmallRs dollars={srDollars} cents={srCents} toneClassName="text-primary" /></div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
        <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
        {isFetchingNextPage ? (
          <div className="grid grid-cols-2 gap-3 mt-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4" aria-hidden>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : null}
        {hasNextPage ? (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            >
              {isFetchingNextPage ? 'Loading…' : 'Load more'}
            </button>
          </div>
        ) : (
          <div className="mt-8 text-center text-sm text-gray-500">No more products</div>
        )}
      </main>
    </>,
  )
}

