import type { Product } from '@/services/api'

type ProductWithDiscountFields = Product & {
  discountPercent?: number
  discount?: number
}

/** True if the API product is treated as discounted (explicit %, generic discount, or original vs sale price). */
export function productHasDiscount(p: Product): boolean {
  const x = p as ProductWithDiscountFields
  if (x.discountPercent != null && Number(x.discountPercent) > 0) return true
  if (x.discount != null && Number(x.discount) > 0) return true
  if (p.originalPrice != null && Number(p.originalPrice) > Number(p.price)) return true
  // originalPrice doubles as a discount % (0–100) when seller sets e.g. 20 = 20% off
  if (p.originalPrice != null && Number(p.originalPrice) > 0 && Number(p.originalPrice) <= 100) return true
  return false
}

/** Badge text for spotlight / shelf (e.g. `32% OFF`). */
export function getProductDiscountPercentLabel(p: Product): string {
  const x = p as ProductWithDiscountFields
  if (x.discountPercent != null && Number(x.discountPercent) > 0) {
    return `${Math.round(Number(x.discountPercent))}% OFF`
  }
  if (x.discount != null && Number(x.discount) > 0) {
    const d = Number(x.discount)
    return d <= 100 && d === Math.floor(d) ? `${Math.round(d)}% OFF` : 'Sale'
  }
  if (p.originalPrice != null && Number(p.originalPrice) > Number(p.price)) {
    const pct = Math.round((1 - Number(p.price) / Number(p.originalPrice)) * 100)
    return pct > 0 ? `${pct}% OFF` : 'Sale'
  }
  if (p.originalPrice != null && Number(p.originalPrice) > 0 && Number(p.originalPrice) <= 100) {
    return `${Math.round(Number(p.originalPrice))}% OFF`
  }
  return 'Deal'
}

export function calculatePrices(p: Product): { finalPrice: number; originalPriceForDisplay: number | null; hasDiscount: boolean } {
  const price = Number(p.price) || 0;
  const origProp = p.originalPrice != null ? Number(p.originalPrice) : null;
  const x = p as ProductWithDiscountFields;

  // Case 1: They sent explicit discountPercent or discount
  const explicitPct = x.discountPercent != null ? Number(x.discountPercent) : (x.discount != null && Number(x.discount) <= 100 && Number(x.discount) === Math.floor(Number(x.discount)) ? Number(x.discount) : null);
  if (explicitPct != null && explicitPct > 0) {
    return {
      finalPrice: price - (price * explicitPct) / 100,
      originalPriceForDisplay: price,
      hasDiscount: true,
    };
  }

  if (origProp != null && origProp > 0) {
    if (origProp > price) {
      // Case 2: old normal originalPrice > price scenario
      return {
        finalPrice: price,
        originalPriceForDisplay: origProp,
        hasDiscount: true,
      };
    } else if (origProp <= 100) {
      // Case 3: origProp is a percentage (e.g. price 200, origProp 10)
      return {
        finalPrice: price - (price * origProp) / 100,
        originalPriceForDisplay: price,
        hasDiscount: true,
      };
    }
  }

  // Case 4: No discount
  return {
    finalPrice: price,
    originalPriceForDisplay: null,
    hasDiscount: false,
  };
}
