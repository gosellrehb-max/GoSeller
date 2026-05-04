/** Matches backend `Product.title` / `detailedTitle` maxlength. */
export const MAX_DETAILED_PRODUCT_TITLE_LENGTH = 2000;

/**
 * Buyer-facing card line for listing name: strong contrast, ~15px, normal weight (reference: in-store tiles).
 * Keep this string literal so Tailwind can scan it (see `tailwind.config.js` content).
 */
export const PRODUCT_CARD_DETAILED_TITLE_CLASSNAME =
  'line-clamp-2 text-[15px] font-normal leading-[1.35] text-gray-600 font-sans antialiased';

/**
 * What shoppers should read as the product name on tiles.
 * Prefers `detailedTitle` (new listings), then full `description` for legacy rows that never had detailedTitle
 * (avoids showing only the old short `title`), then falls back to `title`.
 */
export function productCardListingHeadline(product: {
  title?: string;
  detailedTitle?: string;
  description?: string;
  name?: string;
}): string {
  const tit = (product.title ?? (product as { name?: string }).name ?? '').trim();
  const detailed = (product.detailedTitle ?? '').trim();
  const desc = (product.description ?? '').trim();
  if (detailed) return detailed;
  if (desc) return desc;
  return tit || 'Product';
}
