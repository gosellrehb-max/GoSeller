'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import MarketplaceSiteHeader from '@/components/layout/MarketplaceSiteHeader'
import { useAuth } from '@/contexts/AuthContext'

/** Routes where the department strip is hidden (matches previous per-page usage). */
const HIDE_SUBNAV_PATHS = new Set(['/cart', '/products'])

export default function GlobalSiteHeader() {
  const pathname = usePathname() ?? ''
  const { user, isAuthenticated, switchRole } = useAuth()
  const switchingRef = useRef(false)

  const isCanonicalAuthPath = pathname.startsWith('/login/') || pathname.startsWith('/register/')
  /** Profile uses {@link DashboardSimpleHeader} instead of the marketplace mega-header. */
  const isProfilePath = pathname === '/profile'
  const isSellerAreaPath =
    pathname === '/seller' ||
    pathname.startsWith('/seller/') ||
    pathname === '/rider' ||
    pathname.startsWith('/rider/')
  const isMarketplacePath =
    !isSellerAreaPath &&
    !isCanonicalAuthPath &&
    !pathname.startsWith('/admin') &&
    !isProfilePath

  // Silently switch to customer role whenever a non-customer lands on any marketplace page.
  useEffect(() => {
    if (!isMarketplacePath) return
    if (!isAuthenticated || !user) return
    if (user.role === 'customer') return
    if (switchingRef.current) return
    switchingRef.current = true
    switchRole('customer', { quiet: true }).finally(() => {
      switchingRef.current = false
    })
  }, [isMarketplacePath, isAuthenticated, user?.role]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isSellerAreaPath) return null
  if (isCanonicalAuthPath) return null
  if (isProfilePath) return null
  const hideSubnav = HIDE_SUBNAV_PATHS.has(pathname)
  return <MarketplaceSiteHeader hideSubnav={hideSubnav} />
}
