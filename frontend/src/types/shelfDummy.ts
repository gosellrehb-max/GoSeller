/** Catalog-style dummy row items (converted to `Product` for shelf cards). */
export type ShelfDummyCard = {
  id: string
  title: string
  price: number
  originalPrice?: number
  images: string[]
}
