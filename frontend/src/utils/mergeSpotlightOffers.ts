import type { Product } from '@/services/api'
import type { SpotlightOfferDummy } from '@/config/spotlightOffersDummy'

export type SpotlightGridItem =
  | { kind: 'product'; product: Product }
  | { kind: 'dummy'; dummy: SpotlightOfferDummy }

/**
 * Backend discounted products first, then dummy offers until `maxTotal` cards.
 */
export function mergeSpotlightOffers(
  discountedProducts: Product[],
  dummies: SpotlightOfferDummy[],
  maxTotal = 8,
): SpotlightGridItem[] {
  const backend: SpotlightGridItem[] = discountedProducts
    .slice(0, maxTotal)
    .map((product) => ({ kind: 'product' as const, product }))
  const out: SpotlightGridItem[] = [...backend]
  let i = 0
  while (out.length < maxTotal && i < dummies.length) {
    out.push({ kind: 'dummy', dummy: dummies[i] })
    i += 1
  }
  return out
}
