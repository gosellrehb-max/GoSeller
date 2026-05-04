import { ridersAPI } from '@/services/api'
import type { LooseRecord } from '@/utils/orderDisplay'

export async function getAvailableOrders(): Promise<LooseRecord[]> {
  const response = await ridersAPI.getAvailableOrders({ page: 1, limit: 50 })
  return (response.orders ?? []) as LooseRecord[]
}

export async function pickOrder(orderId: string): Promise<void> {
  await ridersAPI.pickOrder(orderId)
}
