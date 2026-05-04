'use client'

import Link from 'next/link'
import { FiChevronRight } from 'react-icons/fi'
import type { PromoEventTile, PromoEventTiles } from '@/config/promoEvents'

type Props = {
  tiles: PromoEventTiles
  hideShoppingCatalog?: boolean
}

function resolveHref(
  href: string,
  hrefSeller: string | undefined,
  hideShoppingCatalog: boolean,
): string {
  if (!hideShoppingCatalog) return href
  return hrefSeller ?? '/seller'
}

type TileVariant = 'tall' | 'wide' | 'small'

const variantClass: Record<TileVariant, string> = {
  tall: 'min-h-[260px] h-full w-full md:min-h-0',
  wide: 'min-h-[180px] h-full w-full md:min-h-0',
  small: 'min-h-[160px] h-full w-full md:min-h-0',
}

function MosaicTile({
  tile,
  hideShoppingCatalog,
  variant,
}: {
  tile: PromoEventTile
  hideShoppingCatalog: boolean
  variant: TileVariant
}) {
  const to = resolveHref(tile.href, tile.hrefSeller, hideShoppingCatalog)
  const compactText = variant === 'small'

  return (
    <Link
      href={to}
      aria-label={`${tile.title}. ${tile.ctaLabel}`}
      className={`group relative flex min-h-0 w-full flex-col overflow-hidden rounded-2xl shadow-wm ring-1 ring-black/5 transition-shadow duration-200 hover:shadow-wm-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 h-full md:flex-1 ${variantClass[variant]} ${tile.cardClassName ?? ''}`}
    >
      <img
        src={tile.imageSrc}
        alt=""
        role="presentation"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
        loading="lazy"
        onError={(e) => {
          const el = e.currentTarget
          if (el.dataset.fallback === '1') return
          el.dataset.fallback = '1'
          el.src = '/images/GoSellrIcon.png'
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/80 via-black/35 to-black/10"
        aria-hidden
      />
      <div
        className={`relative z-10 flex h-full min-h-0 flex-col justify-end ${
          compactText ? 'gap-0.5 p-2.5 md:p-3' : 'gap-1 p-3 md:p-4'
        }`}
      >
        {tile.eyebrow ? (
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/90 drop-shadow-sm">
            {tile.eyebrow}
          </p>
        ) : null}
        <h3
          className={`font-bold leading-snug text-white drop-shadow-sm ${
            compactText ? 'text-[13px] line-clamp-2' : 'text-sm md:text-base line-clamp-3'
          }`}
        >
          {tile.title}
        </h3>
        {tile.description ? (
          <p
            className={`text-white/85 drop-shadow-sm ${compactText ? 'text-[11px] line-clamp-2' : 'text-xs line-clamp-2'}`}
          >
            {tile.description}
          </p>
        ) : null}
        <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-white underline decoration-white/70 underline-offset-2 group-hover:decoration-white">
          {tile.ctaLabel}
          <FiChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </span>
      </div>
    </Link>
  )
}

export default function PromoEventMosaic({ tiles, hideShoppingCatalog = false }: Props) {
  const { left, centerTop, centerBottomLeft, centerBottomRight, right } = tiles

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 md:hidden">
        <MosaicTile tile={left} hideShoppingCatalog={hideShoppingCatalog} variant="tall" />
        <MosaicTile tile={centerTop} hideShoppingCatalog={hideShoppingCatalog} variant="wide" />
        <div className="grid grid-cols-2 gap-3">
          <MosaicTile tile={centerBottomLeft} hideShoppingCatalog={hideShoppingCatalog} variant="small" />
          <MosaicTile tile={centerBottomRight} hideShoppingCatalog={hideShoppingCatalog} variant="small" />
        </div>
        <MosaicTile tile={right} hideShoppingCatalog={hideShoppingCatalog} variant="tall" />
      </div>

      <div className="hidden md:grid md:min-h-[500px] md:grid-cols-[minmax(0,2.15fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)] md:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] md:gap-3 md:items-stretch lg:min-h-[580px]">
        <div className="flex h-full min-h-0 flex-col md:col-start-1 md:col-end-2 md:row-start-1 md:row-end-3">
          <MosaicTile tile={left} hideShoppingCatalog={hideShoppingCatalog} variant="tall" />
        </div>
        <div className="flex h-full min-h-0 flex-col md:col-start-2 md:col-end-4 md:row-start-1 md:row-end-2">
          <MosaicTile tile={centerTop} hideShoppingCatalog={hideShoppingCatalog} variant="wide" />
        </div>
        <div className="flex h-full min-h-0 flex-col md:col-start-2 md:col-end-3 md:row-start-2 md:row-end-3">
          <MosaicTile tile={centerBottomLeft} hideShoppingCatalog={hideShoppingCatalog} variant="small" />
        </div>
        <div className="flex h-full min-h-0 flex-col md:col-start-3 md:col-end-4 md:row-start-2 md:row-end-3">
          <MosaicTile tile={centerBottomRight} hideShoppingCatalog={hideShoppingCatalog} variant="small" />
        </div>
        <div className="flex h-full min-h-0 flex-col md:col-start-4 md:col-end-5 md:row-start-1 md:row-end-3">
          <MosaicTile tile={right} hideShoppingCatalog={hideShoppingCatalog} variant="tall" />
        </div>
      </div>
    </div>
  )
}
