const STORAGE_KEY = 'gosellr_recently_viewed'
const MAX_IDS = 16

export function getRecentlyViewedProductIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((x): x is string => typeof x === 'string' && x.length > 0)
      .slice(0, MAX_IDS)
  } catch {
    return []
  }
}

/** Call when a customer opens a product detail page (dedupes & caps list). */
export function recordProductView(productId: string): void {
  if (typeof window === 'undefined' || !productId) return
  try {
    const prev = getRecentlyViewedProductIds().filter((id) => id !== productId)
    prev.unshift(productId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prev.slice(0, MAX_IDS)))
    window.dispatchEvent(new CustomEvent('gosellr-recently-viewed-updated'))
  } catch {
    /* quota / private mode */
  }
}
