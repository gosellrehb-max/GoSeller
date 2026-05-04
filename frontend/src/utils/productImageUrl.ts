/**
 * Resolves product image URLs for <img src>. Handles absolute URLs (e.g. Cloudinary)
 * and relative paths (prefixed with API origin or current site origin when env has no host).
 */
const PRODUCT_IMAGE_FALLBACK = '/images/GoSellrIcon.png';

export function productImageUrl(url: string | undefined | null | { url?: string }): string {
  let raw: string | undefined;
  if (url == null || url === '') raw = undefined;
  else if (typeof url === 'object' && url !== null && 'url' in url) raw = (url as { url?: string }).url;
  else raw = String(url).trim();

  if (raw == null || raw === '') return PRODUCT_IMAGE_FALLBACK;
  const s = raw;
  if (/^https?:\/\//i.test(s) || s.startsWith('data:') || s.startsWith('blob:')) return s;

  const rawBase = process.env.NEXT_PUBLIC_API_URL ?? '';
  let origin = String(rawBase).replace(/\/api\/?$/i, '').replace(/\/$/, '');
  if (!origin && typeof window !== 'undefined') {
    origin = window.location.origin;
  }
  if (s.startsWith('/')) return origin ? `${origin}${s}` : s;
  return origin ? `${origin}/${s}` : s;
}

type ProductImageLike = {
  imageUrl?: unknown;
  images?: unknown;
  image?: unknown;
} | null | undefined;

/** Prefer API-provided `imageUrl`, then fall back to legacy image fields. */
export function resolveProductPrimaryImage(product: ProductImageLike): string {
  if (!product) return PRODUCT_IMAGE_FALLBACK;
  const direct = typeof product.imageUrl === 'string' ? product.imageUrl.trim() : '';
  if (direct) return productImageUrl(direct);
  const first =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : product.image;
  return productImageUrl((first as string | undefined) ?? '');
}

/** Coerce API `images` (strings or legacy shapes) to a clean URL list. */
export function normalizeProductImages(raw: unknown): string[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (item == null) return '';
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object' && item !== null && 'url' in item)
        return String((item as { url?: string }).url ?? '').trim();
      return String(item).trim();
    })
    .filter(Boolean);
}
