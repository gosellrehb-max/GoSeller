import type { Product } from '@/services/api'
import type { ShelfDummyCard } from '@/types/shelfDummy'

/** Build a minimal `Product` for display-only shelf cards (add-to-cart disabled for dummy ids). */
export function shelfDummyToProduct(d: ShelfDummyCard): Product {
  const dummyKey = `dummy-${d.id}`
  return {
    _id: dummyKey,
    id: dummyKey,
    title: d.title,
    description: '',
    price: d.price,
    originalPrice: d.originalPrice,
    stock: 99,
    category: 'General',
    images: d.images,
    sellerId: {
      businessName: 'GoSellr',
    } as Product['sellerId'],
    status: 'active',
    isActive: true,
    views: 0,
    sales: 0,
    rating: { average: 4.5, count: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function shelfDummiesToProducts(cards: ShelfDummyCard[]): Product[] {
  return cards.map(shelfDummyToProduct)
}

/**
 * API products first, then dummy products, up to `maxTotal` cards.
 */
export function mergeShelfProducts(apiProducts: Product[], dummyCards: ShelfDummyCard[], maxTotal = 24): Product[] {
  const api = apiProducts.slice(0, maxTotal)
  const remaining = maxTotal - api.length
  if (remaining <= 0) return api
  const dummies = shelfDummiesToProducts(dummyCards.slice(0, remaining))
  return [...api, ...dummies]
}
