'use client'

import Link from 'next/link'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import type { HomeCategoryTile } from '@/types/homeCategoryTile'

type Props = {
  tiles: HomeCategoryTile[]
  hideShoppingCatalog?: boolean
  viewAllHref?: string
}

function resolveHref(href: string, hideShoppingCatalog: boolean): string {
  if (!hideShoppingCatalog) return href
  if (href.startsWith('/category/') || href.startsWith('/products')) return '/seller'
  return href
}

export default function GetItAllRightHereCarousel({
  tiles,
  hideShoppingCatalog = false,
  viewAllHref = '/products',
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const userHasScrolledRef = useRef(false)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const edge = 6
    setCanRight(scrollLeft + clientWidth < scrollWidth - edge)
    setCanLeft(userHasScrolledRef.current && scrollLeft > edge)
  }, [])

  const tilesKey = tiles.map((t) => t.id).join('|')

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    userHasScrolledRef.current = false
    el.scrollLeft = 0
    updateScrollState()
  }, [tilesKey, updateScrollState])

  useEffect(() => {
    updateScrollState()
    const t = window.setTimeout(updateScrollState, 300)
    return () => window.clearTimeout(t)
  }, [tilesKey, updateScrollState])

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
  }, [updateScrollState, tilesKey])

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    const delta = Math.min(el.clientWidth * 0.75, 480)
    el.scrollBy({ left: dir * delta, behavior: 'smooth' })
  }

  if (!tiles.length) return null

  return (
    <section id="explore-categories" className="scroll-mt-24">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-wm-ink tracking-tight">Get it all right here</h2>
        <Link
          href={hideShoppingCatalog ? '/seller' : viewAllHref}
          className="text-sm font-normal text-wm-ink underline underline-offset-2 decoration-wm-ink/80 hover:text-primary hover:decoration-primary shrink-0"
        >
          View all
        </Link>
      </div>

      <div className="relative">
        {canLeft ? (
          <button
            type="button"
            aria-label="Scroll categories left"
            onClick={() => scrollByDir(-1)}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-wm-border bg-white text-wm-ink shadow-md hover:bg-white sm:opacity-95"
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>
        ) : null}

        <div
          ref={scrollRef}
          className={`flex gap-3 sm:gap-4 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory scroll-smooth ${
            canLeft ? 'pl-11' : 'pl-0'
          } ${canRight ? 'pr-12' : 'pr-1'}`}
        >
          {tiles.map((tile) => (
            <Link
              key={tile.id}
              href={resolveHref(tile.href, hideShoppingCatalog)}
              className="snap-start shrink-0 w-[100px] sm:w-[112px] flex flex-col items-center gap-2 group"
            >
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#ececec] transition-transform duration-200 group-hover:scale-[1.02]">
                <img
                  src={tile.image}
                  alt={tile.label}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
              </div>
              <span className="text-[13px] sm:text-sm font-normal text-center text-wm-ink leading-tight px-0.5 line-clamp-2">
                {tile.label}
              </span>
            </Link>
          ))}
        </div>

        {canRight ? (
          <button
            type="button"
            aria-label="Scroll categories right"
            onClick={() => scrollByDir(1)}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-wm-ink/25 bg-white text-wm-ink shadow-sm hover:bg-white"
          >
            <FiChevronRight className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </section>
  )
}
