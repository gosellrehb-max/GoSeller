import type { Category } from '@/config/categories'

/**
 * One distinct hero image per catalog category for “Get it all right here” tiles.
 * (getProductImage() uses different product names than HomePage best sellers, so it always fell back to the same headphones URL.)
 */
export const CATEGORY_TILE_IMAGES: Record<Category, string> = {
  Grocery: '/images/GoSellrIcon.png',
  Electronics: '/images/GoSellrIcon.png',
  Fashion: '/images/GoSellrIcon.png',
  Home: '/images/GoSellrIcon.png',
  Beauty: '/images/GoSellrIcon.png',
  Sports: '/images/GoSellrIcon.png',
  Books: '/images/GoSellrIcon.png',
  Automotive: '/images/GoSellrIcon.png',
  Health: '/images/GoSellrIcon.png',
  Other: '/images/GoSellrIcon.png',
}

export function getCategoryTileImage(categoryName: string): string | undefined {
  return CATEGORY_TILE_IMAGES[categoryName as Category]
}
