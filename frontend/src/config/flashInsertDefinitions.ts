import type { BadgeKind } from '@/features/marketplace/components/home/MarketplaceHomeShelves'

/** Promo tile (half-width) — lifestyle image + copy + optional price callout. */
export type FlashInsertBanner = {
  imageSrc: string
  imageAlt?: string
  eyebrow?: string
  headline: string
  ctaLabel: string
  href: string
  hrefSeller?: string
  priceNow?: number
  priceWas?: number
}

export type FlashInsertDefinition = {
  id: string
  sectionId: string
  title: string
  subtitle?: string
  viewAllHref: string
  /** Full-bleed promo image on this side; product carousel fills the other half. */
  mediaSide: 'left' | 'right'
  banner: FlashInsertBanner
  badgeKind: BadgeKind
}

/** Flash inserts: configurable promos + product carousel; `mediaSide` swaps banner left/right. */
export const FLASH_INSERT_AFTER_GET_IT_ALL: FlashInsertDefinition = {
  id: 'flash-nursery-home',
  sectionId: 'flash-nursery-home',
  title: 'Nursery savings & more!',
  subtitle: 'Free crib assembly on select styles.*',
  viewAllHref: '/products',
  mediaSide: 'right',
  badgeKind: 'featured',
  banner: {
    imageSrc:
      '/images/GoSellrIcon.png',
    imageAlt: 'Nursery with crib',
    eyebrow: 'Sweet dreams start here',
    headline: 'Beloved crib brands, for less',
    ctaLabel: 'Shop now',
    href: '/products',
    priceNow: 186.15,
    priceWas: 249,
  },
}

export const FLASH_INSERT_AFTER_DISCOUNTS: FlashInsertDefinition = {
  id: 'flash-snacks-pantry',
  sectionId: 'flash-snacks-pantry',
  title: 'Stock the pantry for less',
  subtitle: 'Bundle & save on snacks, drinks & staples.',
  viewAllHref: '/products',
  mediaSide: 'left',
  badgeKind: 'discount',
  banner: {
    imageSrc:
      '/images/GoSellrIcon.png',
    imageAlt: 'Grocery and pantry items',
    eyebrow: 'This week only',
    headline: 'Rollbacks on family favorites',
    ctaLabel: 'Shop deals',
    href: '/products',
    priceNow: 12.97,
    priceWas: 18.47,
  },
}
