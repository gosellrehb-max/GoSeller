import { getCategoryTileImage } from '@/config/categoryTileImages'
import type { HomeCategoryTile } from '@/types/homeCategoryTile'

/** Minimal shape from `ShowcaseCategory` for tile thumbnails (avoids circular imports). */
export type CategoryForHomeTiles = {
  id: string
  name: string
  slug: string
  bestSellers: { name?: string; imageUrl?: string; images?: string[] }[]
}

/**
 * Live categories first (thumbnail from first best seller or placeholder), then dummy tiles.
 * Skips dummy entries whose `href` is already covered by an API tile.
 */
export function mergeHomeCategoryTiles(
  categories: CategoryForHomeTiles[],
  dummyTiles: HomeCategoryTile[],
  getProductImage: (productName: string, category: string) => string,
  maxTotal = 24,
): HomeCategoryTile[] {
  const api: HomeCategoryTile[] = categories.map((c) => {
    const first = c.bestSellers[0]
    // Curated per-category art — HomePage best-seller names don't match getProductImage() keys, so that helper always returned the same fallback (headphones).
    const curated = getCategoryTileImage(c.name)
    const img =
      curated ||
      first?.imageUrl ||
      first?.images?.[0] ||
      getProductImage(first?.name ?? `${c.name} highlight`, c.name)
    return {
      id: `api-${c.id}`,
      label: c.name,
      href: `/category/${c.slug}`,
      image: img,
    }
  })

  const seenLabels = new Set(api.map((t) => t.label.trim().toLowerCase()))
  const rest: HomeCategoryTile[] = []
  for (const d of dummyTiles) {
    const key = d.label.trim().toLowerCase()
    if (seenLabels.has(key)) continue
    seenLabels.add(key)
    rest.push(d)
  }

  return [...api, ...rest].slice(0, maxTotal)
}
