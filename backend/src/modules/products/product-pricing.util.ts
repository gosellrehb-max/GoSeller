/**
 * Mirrors frontend `calculatePrices().finalPrice` so checkout uses the same payable unit price
 * (discount %, originalPrice as strikethrough vs sale price, or originalPrice as % off list).
 */
export function effectiveUnitPrice(product: {
  price?: number;
  originalPrice?: number;
  discountPercent?: number;
  discount?: number;
}): number {
  const price = Number(product.price) || 0;
  const origProp = product.originalPrice != null ? Number(product.originalPrice) : null;

  const explicitPct =
    product.discountPercent != null
      ? Number(product.discountPercent)
      : product.discount != null &&
          Number(product.discount) <= 100 &&
          Number(product.discount) === Math.floor(Number(product.discount))
        ? Number(product.discount)
        : null;

  if (explicitPct != null && explicitPct > 0) {
    return Math.max(0, price - (price * explicitPct) / 100);
  }

  if (origProp != null && origProp > 0) {
    if (origProp > price) {
      return price;
    }
    if (origProp <= 100) {
      return Math.max(0, price - (price * origProp) / 100);
    }
  }

  return price;
}
