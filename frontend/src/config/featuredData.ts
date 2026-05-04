import type { ShelfDummyCard } from '@/types/shelfDummy'
const PLACEHOLDER = '/images/GoSellrIcon.png'

/** Fallback cards for the Featured shelf when the API returns fewer items. */
export const FEATURED_DUMMY_DATA: ShelfDummyCard[] = [
  { id: 'fd-1', title: 'Wireless earbuds', price: 2499, originalPrice: 3299, images: [PLACEHOLDER] },
  { id: 'fd-2', title: 'Stainless kettle', price: 1899, originalPrice: 2399, images: [PLACEHOLDER] },
  { id: 'fd-3', title: 'Desk lamp LED', price: 1299, images: [PLACEHOLDER] },
  { id: 'fd-4', title: 'Yoga mat', price: 899, originalPrice: 1199, images: [PLACEHOLDER] },
  { id: 'fd-5', title: 'Ceramic mug set', price: 699, images: [PLACEHOLDER] },
  { id: 'fd-6', title: 'USB-C hub', price: 2199, originalPrice: 2799, images: [PLACEHOLDER] },
  { id: 'fd-7', title: 'Cotton throw', price: 1599, images: [PLACEHOLDER] },
  { id: 'fd-8', title: 'Water bottle 1L', price: 499, originalPrice: 699, images: [PLACEHOLDER] },
  { id: 'fd-9', title: 'Notebook pack', price: 349, images: [PLACEHOLDER] },
  { id: 'fd-10', title: 'Phone stand', price: 599, images: [PLACEHOLDER] },
  { id: 'fd-11', title: 'Scented candle', price: 799, originalPrice: 999, images: [PLACEHOLDER] },
  { id: 'fd-12', title: 'Travel pillow', price: 999, images: [PLACEHOLDER] },
]
