/** Public CMS reads (`/cms/*`) — keep keys centralized for invalidation after admin publishes */
export const cmsQueryKeys = {
  root: ['cms'] as const,
  carousels: ['cms', 'carousels'] as const,
  promoBanners: ['cms', 'promo-banners'] as const,
};
