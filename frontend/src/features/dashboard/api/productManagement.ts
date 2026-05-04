import api, { productsAPI } from '@/services/api'

type ProductFilters = {
  status?: string
  category?: string
  search?: string
  minPrice?: string
  maxPrice?: string
  inStock?: string
}

type PaginationInput = {
  current: number
  limit: number
}

export async function getManagedProducts(input: {
  sellerId: string
  pagination: PaginationInput
  filters: ProductFilters
}) {
  const { sellerId, pagination, filters } = input
  const res = await api.get(`/products/seller/${sellerId}/manage`, {
    params: { page: pagination.current, limit: pagination.limit, ...filters },
  })
  const data = res.data?.data ?? res.data
  return {
    products: data?.products ?? [],
    pagination: data?.pagination,
  }
}

export async function getSellerStats() {
  const res = await api.get('/seller/me/stats')
  const data = res.data?.data ?? res.data
  return data?.stats ?? null
}

export async function bulkUpdateProductStatus(input: { productIds: string[]; status: string }) {
  for (const productId of input.productIds) {
    await api.put(`/products/${productId}`, { status: input.status })
  }
}

export async function deleteManagedProduct(productId: string) {
  await productsAPI.delete(productId)
}
