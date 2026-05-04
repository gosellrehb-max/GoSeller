import { sellerRegistrationAPI } from '@/services/api'

export async function getSellerProfileById(sellerId: string) {
  const response = await sellerRegistrationAPI.getProfile(sellerId)
  return response?.seller
}
