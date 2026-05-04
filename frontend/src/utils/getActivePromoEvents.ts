import type { PromoEventBundle } from '@/config/promoEvents'
import { PROMO_EVENT_BUNDLES } from '@/config/promoEvents'

/**
 * Returns enabled event bundles whose optional date window contains `at` (defaults to now).
 */
export function getActivePromoEvents(at: Date = new Date()): PromoEventBundle[] {
  return PROMO_EVENT_BUNDLES.filter((e) => {
    if (!e.enabled) return false
    if (e.startsAt != null && at < new Date(e.startsAt)) return false
    if (e.endsAt != null && at > new Date(e.endsAt)) return false
    return true
  }).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}
