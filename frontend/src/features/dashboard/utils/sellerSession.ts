export function getSellerIdFromSession(): string | null {
  if (typeof window === 'undefined') return null
  const fromStorage = localStorage.getItem('sellerId')
  if (fromStorage) return fromStorage
  const token = localStorage.getItem('sellerToken') || localStorage.getItem('authToken')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Math.floor(Date.now() / 1000)
    if (payload?.exp && payload.exp < currentTime) return null
    return payload?.sellerId || payload?.id || null
  } catch {
    return null
  }
}

export function hasAnyAuthToken(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(localStorage.getItem('sellerToken') || localStorage.getItem('authToken'))
}
