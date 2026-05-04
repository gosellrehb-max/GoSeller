'use client'

import Link from 'next/link'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import type { FlashInsertDefinition } from '@/config/flashInsertDefinitions'
import { ProductShelfCard } from '@/features/marketplace/components/home/MarketplaceHomeShelves'
import { getProductId, type Product } from '@/services/api'

const FLASH_INSERT_VISIBLE_COLUMNS_LG = 3
const FLASH_BANNER_FALLBACK = '/images/GoSellrIcon.png'

type Props = {
  definition: FlashInsertDefinition
  products: Product[]
  hideShoppingCatalog?: boolean
}

function resolveHref(
  href: string,
  hrefSeller: string | undefined,
  hideShoppingCatalog: boolean,
): string {
  if (!hideShoppingCatalog) return href
  if (href.startsWith('/category/') || href.startsWith('/products')) return '/seller'
  return hrefSeller ?? '/seller'
}

function FlashInsertBannerHalf({
  banner,
  hideShoppingCatalog,
}: {
  banner: FlashInsertDefinition['banner']
  hideShoppingCatalog: boolean
}) {
  const to = resolveHref(banner.href, banner.hrefSeller, hideShoppingCatalog)
  const hasPrice = banner.priceNow != null

  return (
    <Link
      href={to}
      className="group relative flex min-h-[260px] overflow-hidden rounded-2xl bg-slate-200 shadow-wm ring-1 ring-black/5 transition-shadow hover:shadow-wm-md md:min-h-[min(360px,42vh)]"
    >
      <img
        src={banner.imageSrc}
        alt={banner.imageAlt ?? ''}
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
        loading="lazy"
        onError={(e) => {
          const target = e.currentTarget
          if (target.src.includes(FLASH_BANNER_FALLBACK)) return
          target.onerror = null
          target.src = FLASH_BANNER_FALLBACK
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/25 to-slate-900/10"
        aria-hidden
      />
      <div className="relative z-10 flex h-full min-h-0 flex-col justify-between p-4 sm:p-5 md:p-6">
        <div className="max-w-[95%]">
          {banner.eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-white/95 drop-shadow-sm sm:text-sm">
              {banner.eyebrow}
            </p>
          ) : null}
          <h3 className="mt-1 text-xl font-bold leading-tight text-white drop-shadow-sm sm:text-2xl md:text-[1.65rem]">
            {banner.headline}
          </h3>
          <span className="mt-3 inline-flex items-center justify-center rounded-full border border-white/90 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-colors group-hover:bg-white">
            {banner.ctaLabel}
          </span>
        </div>
        {hasPrice ? (
          <div className="mt-auto flex flex-col items-start gap-0.5">
            {banner.priceWas != null ? (
              <p className="text-sm font-medium text-white/80 line-through drop-shadow-sm">
                PKR {Number(banner.priceWas).toFixed(2)}
              </p>
            ) : null}
            <p className="text-3xl font-bold tabular-nums text-white drop-shadow-md sm:text-4xl">
              PKR {Number(banner.priceNow).toFixed(2)}
            </p>
          </div>
        ) : null}
      </div>
    </Link>
  )
}

export default function FlashInsert({ definition, products, hideShoppingCatalog = false }: Props) {
  const { sectionId, title, subtitle, viewAllHref, mediaSide, banner, badgeKind } = definition
  const scrollRef = useRef<HTMLDivElement>(null)
  const userHasScrolledRef = useRef(false)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const viewAll = resolveHref(viewAllHref, undefined, hideShoppingCatalog)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const edge = 6
    setCanRight(scrollLeft + clientWidth < scrollWidth - edge)
    setCanLeft(userHasScrolledRef.current && scrollLeft > edge)
  }, [])

  const productsKey = products.map((p) => getProductId(p) || p.title).join('|')

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    userHasScrolledRef.current = false
    el.scrollLeft = 0
    updateScrollState()
  }, [productsKey, updateScrollState])

  useEffect(() => {
    updateScrollState()
    const t = window.setTimeout(updateScrollState, 300)
    return () => window.clearTimeout(t)
  }, [productsKey, updateScrollState])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      if (el.scrollLeft > 0) userHasScrolledRef.current = true
      updateScrollState()
    }
    const ro = new ResizeObserver(() => updateScrollState())
    ro.observe(el)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', onScroll)
    }
  }, [updateScrollState, productsKey])

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    const delta = Math.min(el.clientWidth * 0.9, 560)
    el.scrollBy({ left: dir * delta, behavior: 'smooth' })
  }

  if (!products.length) return null

  const productsHalf = (
    <div className="relative min-h-0 min-w-0 flex-1">
      {canLeft ? (
        <button
          type="button"
          aria-label="Scroll products left"
          onClick={() => scrollByDir(-1)}
          className="absolute left-2 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-wm-border bg-white/95 text-wm-ink shadow-md ring-2 ring-white hover:bg-white"
        >
          <FiChevronLeft className="h-5 w-5" />
        </button>
      ) : null}
      <div
        ref={scrollRef}
        className="flex min-w-0 gap-3 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory scroll-smooth px-0"
      >
        {products.map((p) => (
          <ProductShelfCard
            key={getProductId(p) || p.title}
            p={p}
            badgeKind={badgeKind}
            variant="minimal"
            minimalLgColumns={FLASH_INSERT_VISIBLE_COLUMNS_LG}
          />
        ))}
      </div>
      {canRight ? (
        <button
          type="button"
          aria-label="Scroll products right"
          onClick={() => scrollByDir(1)}
          className="absolute right-2 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-wm-ink/20 bg-white text-wm-ink shadow-sm ring-2 ring-white hover:bg-white"
        >
          <FiChevronRight className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  )

  const bannerHalf = (
    <FlashInsertBannerHalf banner={banner} hideShoppingCatalog={hideShoppingCatalog} />
  )

  return (
    <section id={sectionId} className="scroll-mt-24">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        <Link
          href={viewAll}
          className="shrink-0 text-sm font-normal text-wm-ink underline decoration-wm-ink/80 underline-offset-2 hover:text-primary hover:decoration-primary"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch md:gap-5 lg:gap-6">
        {mediaSide === 'left' ? (
          <>
            <div className="min-w-0">{bannerHalf}</div>
            <div className="flex min-h-[280px] min-w-0 flex-col md:min-h-[min(360px,42vh)]">{productsHalf}</div>
          </>
        ) : (
          <>
            <div className="flex min-h-[280px] min-w-0 flex-col md:min-h-[min(360px,42vh)]">{productsHalf}</div>
            <div className="min-w-0">{bannerHalf}</div>
          </>
        )}
      </div>
    </section>
  )
}
