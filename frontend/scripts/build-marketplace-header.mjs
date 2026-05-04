import fs from 'fs'

const path = 'src/components/home/MarketplaceHomeView.tsx'
const s = fs.readFileSync(path, 'utf8')
const lines = s.split(/\r?\n/)

const headerStart = lines.findIndex((l) => l.includes('Walmart-style header'))
const headerEnd = lines.findIndex((l, i) => i > headerStart && l.trim() === '</header>')
if (headerStart < 0 || headerEnd < 0) throw new Error(`markers ${headerStart} ${headerEnd}`)

const headerJsx = lines.slice(headerStart - 1, headerEnd + 1).join('\n')
const guest = lines.slice(95, 236).join('\n')
const constBlock = lines.slice(237, 262).join('\n')
const subFx = lines.slice(438, 456).join('\n')
const subClasses = lines.slice(523, 551).join('\n')
const profFx = lines.slice(551, 573).join('\n')

const out = `/* auto-extracted — Marketplace site header (same as home) */
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  FiSearch,
  FiShoppingCart,
  FiMenu,
  FiX,
  FiChevronRight,
  FiChevronDown,
  FiUser,
  FiMapPin,
  FiShoppingBag,
  FiTool,
  FiClipboard,
  FiMessageCircle,
  FiCreditCard,
  FiTag,
  FiPlusCircle,
  FiHeart,
} from 'react-icons/fi'
import { CATEGORY_SUBMENU, CATEGORIES, CATEGORY_TO_SLUG_MAPPING } from '@/config/categories'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'

${guest}

${constBlock}

type NavCategory = { id: string; name: string; slug: string }

export default function MarketplaceSiteHeader() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const { getCartItemCount } = useCart()
  const cartCount = getCartItemCount()
  const hideShoppingCatalog = user?.role === 'seller'
  const userFirstName = user?.firstName
  const userLastName = user?.lastName
  const userEmail = user?.email
  const userRole = user?.role

  const [searchQuery, setSearchQuery] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [subnavCatOpen, setSubnavCatOpen] = useState(false)
  const [subnavHoveredCategorySlug, setSubnavHoveredCategorySlug] = useState<string | null>(null)
  const [subnavMobileAccordionSlug, setSubnavMobileAccordionSlug] = useState<string | null>(null)
  const [subnavServicesOpen, setSubnavServicesOpen] = useState(false)
  const profileMenuRefDesktop = useRef<HTMLDivElement | null>(null)
  const profileMenuRefMobile = useRef<HTMLDivElement | null>(null)
  const subnavCatRef = useRef<HTMLDivElement | null>(null)
  const subnavServicesRef = useRef<HTMLDivElement | null>(null)
  const searchBarDesktopRef = useRef<HTMLFormElement | null>(null)
  const searchBarMobileRef = useRef<HTMLFormElement | null>(null)
  const trendingScrollDesktopRef = useRef<HTMLDivElement | null>(null)
  const trendingScrollMobileRef = useRef<HTMLDivElement | null>(null)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

  const gosellerCategories = useMemo((): NavCategory[] => {
    return CATEGORIES.map((name, index) => ({
      id: String(index + 1),
      name,
      slug: CATEGORY_TO_SLUG_MAPPING[name],
    }))
  }, [])

${subFx}

${profFx}

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) router.push(\`/search?q=\${encodeURIComponent(q)}\`)
  }

  const applyTrendingSearch = (term: string) => {
    setSearchQuery(term)
    setIsSearchExpanded(false)
    router.push(\`/search?q=\${encodeURIComponent(term)}\`)
  }

  const onLogout = async () => {
    await logout()
  }

  const onAddDeliveryAddress = () => {
    toast('Set your delivery location at checkout, or sign in and update your saved address in account settings.')
  }

${subClasses}

  const firstCategorySlug = gosellerCategories[0]?.slug ?? ''
  const resolvedFlyoutSlug =
    subnavHoveredCategorySlug != null &&
    gosellerCategories.some((c) => c.slug === subnavHoveredCategorySlug)
      ? subnavHoveredCategorySlug
      : firstCategorySlug
  const activeFlyoutCategory =
    gosellerCategories.find((c) => c.slug === resolvedFlyoutSlug) ?? gosellerCategories[0]

  const fullCustomerName = [userFirstName, userLastName].filter(Boolean).join(' ').trim()

  return (
    <>
${headerJsx}
    </>
  )
}
`

fs.writeFileSync('src/components/layout/MarketplaceSiteHeader.tsx', out)
console.log('written', out.length)
