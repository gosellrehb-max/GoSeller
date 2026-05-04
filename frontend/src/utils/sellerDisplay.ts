/**
 * Backend populates Seller with `businessName` (and optional legacy/alt fields).
 * Frontend types used `shopName` / `name` — normalize here for listings and product detail.
 */
export function getSellerDisplayName(seller: unknown): string {
  if (!seller || typeof seller !== 'object') return 'Unknown Store';
  const s = seller as Record<string, unknown>;
  const name =
    (typeof s.shopName === 'string' && s.shopName.trim()) ||
    (typeof s.businessName === 'string' && s.businessName.trim()) ||
    (typeof s.name === 'string' && s.name.trim());
  return name || 'Unknown Store';
}

export function getSellerInitial(seller: unknown): string {
  const name = getSellerDisplayName(seller);
  return name !== 'Unknown Store' ? name.charAt(0).toUpperCase() : 'S';
}
