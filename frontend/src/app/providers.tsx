'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { WishlistProvider } from '@/contexts/WishlistContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { PageLoadOverlay } from '@/components/layout/PageLoadOverlay'

/**
 * Global QueryClient defaults.
 *
 * staleTime: 30s   — any query without an explicit override won't re-fetch on navigation
 *                    within the stale window. Queries that need fresher data (e.g. orders)
 *                    or longer-lived data (home shelves, reviews) set their own staleTime.
 * gcTime: 5min     — cached data stays in memory across route changes so back-nav is instant.
 * refetchOnWindowFocus: false — tab-switching should not silently re-fetch catalog data.
 * retry: 1         — default 3 retries causes 5-10 s hanging on auth/network errors.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <PageLoadOverlay />
            {children}
            <Toaster position="top-center" toastOptions={{ duration: 4500 }} />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
