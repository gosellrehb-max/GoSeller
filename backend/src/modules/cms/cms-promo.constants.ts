/** Slots persisted from URL param `:slot` — must align with admin PromoBannersManager flash inserts */
export const CMS_FLASH_PROMO_SLOTS = ['flash_after_discounts', 'flash_after_get_it_all'] as const;

/** Category promo tiles — must mirror admin CategoryImagesManager + frontend categories */
export const CMS_CATEGORY_PROMO_SLUGS = [
  'grocery',
  'electronics',
  'fashion',
  'home',
  'beauty',
  'sports',
  'books',
  'automotive',
  'health',
  'other',
] as const;

export type CmsFlashPromoSlot = (typeof CMS_FLASH_PROMO_SLOTS)[number];
export type CmsCategoryPromoSlug = (typeof CMS_CATEGORY_PROMO_SLUGS)[number];
