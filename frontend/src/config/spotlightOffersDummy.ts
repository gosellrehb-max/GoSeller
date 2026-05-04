/** Fallback cards for the “20% – 40% OFF” spotlight grid when the catalog has fewer discounted items. */
export type SpotlightOfferDummy = {
  title: string
  off: string
  img: string
}

export const SPOTLIGHT_OFFERS_DUMMY: SpotlightOfferDummy[] = [
  {
    title: 'Burger combo',
    off: '35% OFF',
    img: '/images/GoSellrIcon.png',
  },
  {
    title: 'Family meal deal',
    off: '40% OFF',
    img: '/images/GoSellrIcon.png',
  },
  {
    title: 'Fresh bowls',
    off: '25% OFF',
    img: '/images/GoSellrIcon.png',
  },
  {
    title: 'Dessert bundle',
    off: '20% OFF',
    img: '/images/GoSellrIcon.png',
  },
]
