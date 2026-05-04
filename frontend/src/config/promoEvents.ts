/**
 * Each **event** (Easter, Summer, …) is a bundle of **5 tiles** in a Walmart-style mosaic:
 * left (wide) | center-top + center-bottom-L + center-bottom-R | right (narrower than left).
 * Multiple enabled bundles → carousel; use arrows to move between events.
 */
export type PromoEventTile = {
  title: string
  description?: string
  eyebrow?: string
  imageSrc: string
  imageAlt: string
  href: string
  hrefSeller?: string
  ctaLabel: string
  cardClassName?: string
  titleClassName?: string
  descClassName?: string
}

export type PromoEventTiles = {
  /** Widest column — full height */
  left: PromoEventTile
  /** Spans middle top */
  centerTop: PromoEventTile
  centerBottomLeft: PromoEventTile
  centerBottomRight: PromoEventTile
 /** Narrower than `left`, full height */
  right: PromoEventTile
}

export type PromoEventBundle = {
  id: string
  enabled: boolean
  startsAt?: string
  endsAt?: string
  sortOrder?: number
  /** e.g. "Easter" — shown above the mosaic */
  headline?: string
  tiles: PromoEventTiles
}

export const PROMO_EVENT_BUNDLES: PromoEventBundle[] = [
  {
    id: 'easter-spring',
    enabled: true,
    startsAt: '2026-03-01T00:00:00.000Z',
    endsAt: '2026-04-30T23:59:59.999Z',
    sortOrder: 1,
    headline: 'Easter',
    tiles: {
      left: {
        eyebrow: 'Spring',
        title: 'Build Easter baskets for all ages',
        description: 'Plush, candy & fillers — from $1.',
        imageSrc:
          '/images/GoSellrIcon.png',
        imageAlt: 'Colorful Easter and spring gifts',
        href: '/products',
        hrefSeller: '/seller',
        ctaLabel: 'Shop now',
        cardClassName: 'bg-gradient-to-br from-emerald-50 via-amber-50 to-rose-50 border border-emerald-100/80',
        titleClassName: 'text-[#0c2d26]',
      },
      centerTop: {
        title: 'Host a feast for 8',
        description: 'Ham, sides & more — under $5 per person.',
        imageSrc:
          '/images/GoSellrIcon.png',
        imageAlt: 'Easter dinner spread',
        href: '/products',
        ctaLabel: 'Shop the list',
        cardClassName: 'bg-slate-50 border border-slate-100',
        titleClassName: 'text-slate-900',
      },
      centerBottomLeft: {
        title: 'Easter hosting made easy',
        imageSrc:
          '/images/GoSellrIcon.png',
        imageAlt: 'Glassware on table',
        href: '/products',
        ctaLabel: 'Shop now',
        cardClassName: 'bg-amber-50/80 border border-amber-100',
        titleClassName: 'text-slate-900',
      },
      centerBottomRight: {
        title: 'Spring blooms',
        imageSrc:
          '/images/GoSellrIcon.png',
        imageAlt: 'Spring flowers in vase',
        href: '/products',
        ctaLabel: 'Shop now',
        cardClassName: 'bg-pink-50 border border-pink-100',
        titleClassName: 'text-slate-900',
      },
      right: {
        eyebrow: 'Candy aisle',
        title: 'Cadbury, jelly beans & more',
        description: 'Easter candy from $2.',
        imageSrc:
          '/images/GoSellrIcon.png',
        imageAlt: 'Easter candy and chocolate eggs',
        href: '/products',
        ctaLabel: 'Shop now',
        cardClassName: 'bg-sky-50 border border-sky-100',
        titleClassName: 'text-[#041e42]',
      },
    },
  },
  {
    id: 'summer-kickoff',
    enabled: false,
    startsAt: '2026-03-15T00:00:00.000Z',
    endsAt: '2026-08-31T23:59:59.999Z',
    sortOrder: 2,
    headline: 'Summer kickoff',
    tiles: {
      left: {
        eyebrow: 'Sun & sand',
        title: 'Everything for beach days',
        description: 'Towels, coolers & more.',
        imageSrc:
          '/images/GoSellrIcon.png',
        imageAlt: 'Beach and ocean',
        href: '/products',
        ctaLabel: 'Shop summer',
        cardClassName: 'bg-gradient-to-br from-sky-100 to-cyan-50 border border-sky-100',
        titleClassName: 'text-slate-900',
      },
      centerTop: {
        title: 'Grill & chill',
        description: 'BBQ essentials under $25.',
        imageSrc:
          '/images/GoSellrIcon.png',
        imageAlt: 'Grilled food',
        href: '/products',
        ctaLabel: 'Shop grills',
        cardClassName: 'bg-orange-50 border border-orange-100',
        titleClassName: 'text-slate-900',
      },
      centerBottomLeft: {
        title: 'Cold drinks',
        imageSrc:
          '/images/GoSellrIcon.png',
        imageAlt: 'Cold beverages',
        href: '/products',
        ctaLabel: 'Stock up',
        cardClassName: 'bg-lime-50 border border-lime-100',
        titleClassName: 'text-slate-900',
      },
      centerBottomRight: {
        title: 'Outdoor games',
        imageSrc:
          '/images/GoSellrIcon.png',
        imageAlt: 'Outdoor fun',
        href: '/products',
        ctaLabel: 'Play outside',
        cardClassName: 'bg-violet-50 border border-violet-100',
        titleClassName: 'text-slate-900',
      },
      right: {
        eyebrow: 'Seasonal',
        title: 'Patio & shade',
        description: 'Umbrellas & seating from $29.',
        imageSrc:
          '/images/GoSellrIcon.png',
        imageAlt: 'Patio furniture',
        href: '/products',
        ctaLabel: 'Shop patio',
        cardClassName: 'bg-stone-50 border border-stone-200',
        titleClassName: 'text-slate-900',
      },
    },
  },
]
