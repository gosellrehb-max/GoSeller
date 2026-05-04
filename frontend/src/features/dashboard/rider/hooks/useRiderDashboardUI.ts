'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import type { RiderTab } from '@/features/dashboard/rider/types/riderDashboardTypes'

export function useRiderDashboardUI() {
  const router = useRouter()
  const { switchRole, logout } = useAuth()
  const [tab, setTab] = useState<RiderTab>('available')
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [switchingRole, setSwitchingRole] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isAccountOpen) return
    const onClickOutside = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [isAccountOpen])

  const handleSignOut = async () => {
    await logout()
    router.push('/login/rider')
  }

  const handleSwitchTo = async (target: 'customer' | 'seller') => {
    if (switchingRole) return
    setSwitchingRole(true)
    try {
      const ROLE_DASHBOARD: Record<'customer' | 'seller', string> = {
        customer: '/',
        seller: '/seller',
      }
      const ROLE_ONBOARDING: Record<'customer' | 'seller', string> = {
        customer: '/register/customer',
        seller: '/seller/settings?onboarding=1',
      }
      const res = await switchRole(target)
      setIsAccountOpen(false)
      if (res.ok) {
        router.push(ROLE_DASHBOARD[target])
        return
      }
      localStorage.setItem('activeAccount', target)
      router.push(ROLE_ONBOARDING[target])
    } finally {
      setSwitchingRole(false)
    }
  }

  return {
    tab,
    setTab,
    isAccountOpen,
    setIsAccountOpen,
    switchingRole,
    accountMenuRef,
    handleSignOut,
    handleSwitchTo,
  }
}
