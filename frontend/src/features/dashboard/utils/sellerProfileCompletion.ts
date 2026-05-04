import type { SellerProfile } from '@/services/api'

function hasText(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
}

export function getIncompleteSellerProfileFields(profile: SellerProfile | null | undefined): string[] {
  if (!profile) return ['profile']

  const missing: string[] = []
  if (!hasText(profile.businessName)) missing.push('businessName')
  if (!hasText(profile.phone)) missing.push('phone')
  if (!hasText(profile.businessType ?? profile.storeCategory)) missing.push('businessType')
  if (!hasText(profile.storePickupAddress)) missing.push('storePickupAddress')
  return missing
}

export function isSellerProfileCompleteForSelling(profile: SellerProfile | null | undefined): boolean {
  return getIncompleteSellerProfileFields(profile).length === 0
}
