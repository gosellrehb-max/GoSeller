'use client'

import { useEffect, useMemo, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { getActivePromoEvents } from '@/utils/getActivePromoEvents'
import PromoEventMosaic from '@/features/marketplace/components/home/PromoEventMosaic'

import type { PromoEventBundle } from '@/config/promoEvents'

type Props = {
  hideShoppingCatalog?: boolean
  /** When provided, replaces the static config entirely (CMS-driven bundles). */
  cmsBundles?: PromoEventBundle[]
}

export default function MarketplaceEventCards({ hideShoppingCatalog = false, cmsBundles }: Props) {
  const staticBundles = useMemo(() => getActivePromoEvents(), [])
  const bundles = cmsBundles ?? staticBundles
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    setSlide(0)
  }, [bundles.map((b) => b.id).join('|')])

  if (bundles.length === 0) return null

  const last = bundles.length - 1
  const canPrev = slide > 0
  const canNext = slide < last

  return (
    <section className="w-full" aria-label="Seasonal events and promotions">
      <div className="mb-3 flex items-center justify-between gap-3">
        {bundles.length > 1 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-wm-muted tabular-nums">
              {slide + 1} / {bundles.length}
            </span>
            <button
              type="button"
              aria-label="Previous event"
              disabled={!canPrev}
              onClick={() => setSlide((s) => Math.max(0, s - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-wm-border bg-white text-wm-ink shadow-sm transition-opacity hover:bg-wm-page disabled:cursor-not-allowed disabled:opacity-35"
            >
              <FiChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next event"
              disabled={!canNext}
              onClick={() => setSlide((s) => Math.min(last, s + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-wm-border bg-white text-wm-ink shadow-sm transition-opacity hover:bg-wm-page disabled:cursor-not-allowed disabled:opacity-35"
            >
              <FiChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>

      <div className="relative w-full overflow-hidden rounded-2xl">
        <div
          className="flex w-full transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${slide * 100}%)` }}
        >
          {bundles.map((bundle, i) => (
            <div
              key={bundle.id}
              className="box-border min-w-0 shrink-0 flex-[0_0_100%] px-0.5"
              aria-hidden={slide !== i}
            >
              <PromoEventMosaic tiles={bundle.tiles} hideShoppingCatalog={hideShoppingCatalog} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
