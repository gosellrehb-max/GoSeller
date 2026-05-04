'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  FiHelpCircle,
  FiLogOut,
  FiMail,
  FiSettings,
  FiShoppingBag,
  FiUser,
} from 'react-icons/fi'
import GoSellerLogo from '@/components/ui/GoSellerLogo'
import { LOGIN_PATH } from '@/features/auth/config/protectedRoutes'
import { useRiderDashboardUI } from '@/features/dashboard/rider/hooks/useRiderDashboardUI'
import { useAuth, authUserIsRider } from '@/contexts/AuthContext'
import { mailtoSupportHref } from '@/lib/supportContact'

function logoHrefForUser(user: {
  role?: string
  roles?: string[]
} | null): string {
  if (!user) return '/'
  if (authUserIsRider(user)) return '/rider'
  const roles = user.roles ?? []
  if (user.role === 'seller' || roles.includes('seller')) return '/seller'
  return '/'
}

function logoutLandingPath(user: { role?: string; roles?: string[] } | null): string {
  if (!user) return LOGIN_PATH.customer
  if (authUserIsRider(user)) return LOGIN_PATH.rider
  const roles = user.roles ?? []
  if (user.role === 'seller' || roles.includes('seller')) return LOGIN_PATH.seller
  return LOGIN_PATH.customer
}

/** Minimal blue bar header (same chrome as the rider dashboard). */
export default function DashboardSimpleHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const isRider = authUserIsRider(user)

  const riderUi = useRiderDashboardUI()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen || isRider) return
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen, isRider])

  const handleSignOutNonRider = async () => {
    await logout()
    router.push(logoutLandingPath(user ?? null))
  }

  const logoHref = logoHrefForUser(user ?? null)

  return (
    <header className="sticky top-0 z-20 h-16 shrink-0 border-b border-[#00318a] bg-primary">
      <div className="flex h-full w-full items-center justify-between px-3 sm:px-4 lg:px-6">
        <Link href={logoHref} className="inline-flex">
          <GoSellerLogo className="h-8 w-auto" />
        </Link>

        {isRider ? (
          <div className="relative" ref={riderUi.accountMenuRef}>
            <button
              type="button"
              onClick={() => riderUi.setIsAccountOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white hover:bg-white/30"
              aria-label="Account menu"
              aria-expanded={riderUi.isAccountOpen}
            >
              <FiUser className="h-5 w-5" />
            </button>
            {riderUi.isAccountOpen ? (
              <div className="absolute right-0 mt-2 w-52 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                <div className="flex flex-col gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => riderUi.handleSwitchTo('customer')}
                    disabled={riderUi.switchingRole}
                    className="flex w-full items-center justify-center gap-2 rounded border border-black bg-transparent px-3 py-1.5 text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiUser className="h-3.5 w-3.5" />
                    <span>Switch to Buyer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => riderUi.handleSwitchTo('seller')}
                    disabled={riderUi.switchingRole}
                    className="flex w-full items-center justify-center gap-2 rounded border border-black bg-transparent px-3 py-1.5 text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiShoppingBag className="h-3.5 w-3.5" />
                    <span>Switch to Selling</span>
                  </button>
                </div>
                <div className="my-1 border-t border-gray-100" />
                <Link
                  href="/profile"
                  className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => riderUi.setIsAccountOpen(false)}
                >
                  <FiSettings className="h-4 w-4" />
                  <span>Profile Settings</span>
                </Link>
                <a
                  href={mailtoSupportHref('GoSellr — Help & Support')}
                  className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiHelpCircle className="h-4 w-4 shrink-0" aria-hidden />
                  Help / Support
                </a>
                <a
                  href={mailtoSupportHref('GoSellr — Feedback')}
                  className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiMail className="h-4 w-4 shrink-0" aria-hidden />
                  Feedback
                </a>
                <div className="my-1 border-t border-gray-100" />
                <button
                  type="button"
                  onClick={() => void riderUi.handleSignOut()}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <FiLogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white hover:bg-white/30"
              aria-label="Account menu"
              aria-expanded={menuOpen}
            >
              <FiUser className="h-5 w-5" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-52 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                <a
                  href={mailtoSupportHref('GoSellr — Help & Support')}
                  className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiHelpCircle className="h-4 w-4 shrink-0" aria-hidden />
                  Help / Support
                </a>
                <a
                  href={mailtoSupportHref('GoSellr — Feedback')}
                  className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiMail className="h-4 w-4 shrink-0" aria-hidden />
                  Feedback
                </a>
                <div className="my-1 border-t border-gray-100" />
                <button
                  type="button"
                  onClick={() => void handleSignOutNonRider()}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <FiLogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </header>
  )
}
