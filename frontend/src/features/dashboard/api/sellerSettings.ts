import { sellerAuthAPI, sellerRegistrationAPI, type SellerProfile } from '@/services/api'

export async function getCurrentSellerProfile(): Promise<SellerProfile | null> {
  const response = await sellerAuthAPI.getProfile()
  return response?.seller ?? null
}

export async function updateSellerProfileById(input: { sellerId: string; payload: Record<string, unknown> | FormData | { [key: string]: unknown } }) {
  return sellerRegistrationAPI.updateProfile(input.sellerId, input.payload)
}
