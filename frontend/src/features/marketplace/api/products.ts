import { productsAPI } from '@/services/api'

type Primitive = string | number | boolean | null | undefined
type ListParamValue = Primitive | Primitive[]
export type ProductListParams = Record<string, Primitive>
export type ProductListBatchParams = Record<string, ListParamValue>

export async function getProducts(params: ProductListParams | ProductListBatchParams) {
  return productsAPI.getAll(params)
}

export async function getProductById(productId: string) {
  return productsAPI.getById(productId)
}

export async function recordProductView(productId: string) {
  return productsAPI.recordView(productId)
}

/** Single-request fetch for all home-page shelves. */
export async function getHomeShelvesData() {
  return productsAPI.getHomeShelves()
}
