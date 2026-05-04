'use client'

import { useCallback, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getAvailableOrders, pickOrder } from '@/features/dashboard/api/riders'
import { getMyOrders, updateOrderStatus } from '@/features/dashboard/api/orders'
import { riderQueryKeys } from '@/features/dashboard/rider/hooks/queryKeys'

type UseRiderOrdersInput = {
  enabled: boolean
}

export function useRiderOrders({ enabled }: UseRiderOrdersInput) {
  const queryClient = useQueryClient()

  const availableQuery = useQuery({
    queryKey: riderQueryKeys.availableOrders,
    enabled,
    queryFn: getAvailableOrders,
  })

  const mineQuery = useQuery({
    queryKey: riderQueryKeys.myOrders,
    enabled,
    queryFn: getMyOrders,
  })

  useEffect(() => {
    if (!availableQuery.error && !mineQuery.error) return
    const error = availableQuery.error ?? mineQuery.error
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    toast.error(err?.response?.data?.message || err?.message || 'Failed to load orders')
  }, [availableQuery.error, mineQuery.error])

  const refreshOrders = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: riderQueryKeys.availableOrders }),
      queryClient.invalidateQueries({ queryKey: riderQueryKeys.myOrders }),
    ])
  }, [queryClient])

  const pickMutation = useMutation({
    mutationFn: pickOrder,
    onSuccess: async () => {
      toast.success('Order assigned to you')
      await refreshOrders()
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      toast.error(err?.response?.data?.message || err?.message || 'Could not pick order')
    },
  })

  const advanceMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: async () => {
      toast.success('Updated')
      await refreshOrders()
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      toast.error(err?.response?.data?.message || err?.message || 'Update failed')
    },
  })

  return {
    available: availableQuery.data ?? [],
    mine: mineQuery.data ?? [],
    loading: enabled ? availableQuery.isLoading || mineQuery.isLoading : false,
    refreshOrders,
    pickOrder: pickMutation.mutateAsync,
    updateOrderStatus: advanceMutation.mutateAsync,
  }
}
