import { sellerAuthAPI } from '@/services/api'

export async function getSellerDashboardProfile() {
  if (typeof window === 'undefined') return null
  const sellerToken = localStorage.getItem('authToken') || localStorage.getItem('sellerToken')
  if (!sellerToken) return null
  const response = await sellerAuthAPI.getProfile()
  return response?.seller ?? null
}
