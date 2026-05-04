'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FiChevronLeft, FiChevronRight, FiPause, FiPlay } from 'react-icons/fi'
import { cmsQueryKeys } from '@/features/cms/queries/queryKeys'
import { cmsAPI } from '@/services/api'

export type PromoSlide = {
  id: string
  title: string
  link: string
  imageSrc: string
  imageAlt: string
}

type MarketplacePromoCarouselProps = {
  hideShoppingCatalog?: boolean
}

export default function MarketplacePromoCarousel({ hideShoppingCatalog = false }: MarketplacePromoCarouselProps) {
  const [slides, setSlides] = useState<PromoSlide[]>([])
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const len = slides.length || 1

  const { data, isLoading } = useQuery({
    queryKey: cmsQueryKeys.carousels,
    queryFn: () => cmsAPI.getCarousels(),
  })

  useEffect(() => {
    const mapped = (data?.carousels ?? [])
      .map((s) => ({
        id: String(s._id ?? s.id ?? '').trim(),
        title: String(s.title ?? '').trim(),
        link: String(s.link ?? '').trim(),
        imageSrc: String(s.imageUrl ?? '').trim(),
        imageAlt: String(s.title ?? 'GoSellr carousel').trim(),
      }))
      .filter((s) => s.id && s.title && s.link && s.imageSrc)
    setSlides(mapped)
    setIndex(0)
  }, [data])

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + len) % len)
    },
    [len],
  )

  useEffect(() => {
    if (isPaused || len <= 1) return
    const t = setInterval(() => setIndex((i) => (i + 1) % len), 5500)
    return () => clearInterval(t)
  }, [isPaused, len])

  const navBtn =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-800 shadow-sm hover:bg-gray-50 transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1'
  const pauseBtn =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-800 shadow-sm hover:bg-gray-50 transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1'
  const slideFrame = 'h-[220px] md:h-[260px]'

  if (!isLoading && slides.length === 0) return null

  return (
    <div className="relative mb-6 w-full min-w-0" role="region" aria-roledescription="carousel" aria-label="Promotional offers">
      <div className="w-full overflow-hidden rounded-xl border border-wm-border shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div
          className="flex transition-transform duration-500 ease-out will-change-transform"
          style={{
            width: `${len * 100}%`,
            transform: `translateX(-${(index * 100) / len}%)`,
          }}
        >
          {slides.map((s) => {
            const href = hideShoppingCatalog ? '/seller' : s.link
            return (
              <article
                key={s.id}
                className={`relative box-border shrink-0 overflow-hidden bg-neutral-900 ${slideFrame}`}
                style={{ width: `${100 / len}%` }}
                aria-roledescription="slide"
                aria-label={`${s.title}. ${s.imageAlt}`}
              >
                <img
                  src={s.imageSrc}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  aria-hidden
                />
                <div className="relative z-[1] flex h-full flex-col justify-center px-5 py-6 sm:px-8 sm:py-8 md:max-w-[min(92%,540px)] md:pl-10 lg:pl-14 xl:pl-16">
                  <h2 className="mt-1 text-xl font-bold leading-snug tracking-tight text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.9),0_1px_3px_rgba(0,0,0,0.95)] sm:text-2xl md:text-[1.75rem] md:leading-snug">
                    {s.title}
                  </h2>
                  <Link
                    href={href}
                    className="mt-3 inline-flex w-max items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    {hideShoppingCatalog ? 'Seller dashboard' : 'Shop now'}
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {len > 1 ? (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 sm:right-4 sm:top-4">
          <button type="button" className={navBtn} onClick={() => go(-1)} aria-label="Previous offer">
            <FiChevronLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            className={pauseBtn}
            onClick={() => setIsPaused((p) => !p)}
            aria-label={isPaused ? 'Play carousel' : 'Pause carousel'}
          >
            {isPaused ? <FiPlay className="h-4 w-4" /> : <FiPause className="h-4 w-4" />}
          </button>
          <button type="button" className={navBtn} onClick={() => go(1)} aria-label="Next offer">
            <FiChevronRight className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
