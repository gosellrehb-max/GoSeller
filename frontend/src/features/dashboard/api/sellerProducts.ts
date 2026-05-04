import { productsAPI, type ProductData as ApiProductData } from '@/services/api'

export async function getSellerProducts(sellerId: string) {
  try {
    const response = await productsAPI.getCurrentSellerProducts()
    if (response?.products) return response.products
  } catch {
    // fallback to legacy seller route
  }
  if (!sellerId) return []
  const legacy = await productsAPI.getBySeller(sellerId)
  return legacy?.products ?? []
}

export async function deleteSellerProduct(productId: string) {
  await productsAPI.delete(productId)
}

export async function getSellerProductById(productId: string) {
  const response = await productsAPI.getById(productId)
  return response.product
}

export async function getSellerCategories() {
  const response = await productsAPI.getCategories()
  return response?.categories ?? []
}

export async function createSellerProduct(input: ApiProductData) {
  return productsAPI.create(input)
}

export async function updateSellerProduct(
  id: string,
  data: Omit<Partial<ApiProductData>, 'images'> & { images?: string[] },
) {
  return productsAPI.update(id, data)
}
