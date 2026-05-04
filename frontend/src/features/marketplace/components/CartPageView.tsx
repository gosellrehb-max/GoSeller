'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { withReturnUrl } from '@/features/auth/utils/returnUrl'
import StorefrontFooter from '@/components/layout/StorefrontFooter'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { productImageUrl } from '@/utils/productImageUrl'

function toProductTitle(item: { product?: { title?: string; name?: string } | null }): string {
  const p = item.product
  return String(p?.title ?? p?.name ?? 'Product')
}

function toProductHref(item: { product?: { _id?: string; id?: string } | null }): string | null {
  const p = item.product
  const id = p?._id ?? p?.id
  return id ? `/product/${id}` : null
}

function linePriceText(price: unknown): string {
  return `PKR ${Number(price ?? 0).toFixed(2)}`
}

export default function CartPageView() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const {
    cart,
    isLoading,
    error,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartTotal,
    clearError,
  } = useCart()

  const items = cart?.items ?? []
  const total = getCartTotal()
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [items],
  )

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Shopping cart</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isAuthenticated ? 'Signed in — your cart is saved.' : 'Sign in to place order and sync cart.'}
        </p>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 flex items-center justify-between gap-4">
            <span className="text-sm">{error}</span>
            <button type="button" onClick={clearError} className="text-xs underline">
              Dismiss
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-8 rounded-xl border border-wm-border bg-white p-6 text-sm text-slate-600">Loading cart...</div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-wm-border bg-white px-6 py-10 sm:px-10 sm:py-12 text-center shadow-sm">
            <div className="mx-auto mb-6 flex max-w-[280px] justify-center sm:max-w-[320px]">
              <img
                src="/images/cart.avif"
                alt="Empty shopping cart"
                className="h-auto w-full max-h-48 object-contain object-center"
                width={320}
                height={240}
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">Your cart is empty</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Looks like you have not added anything yet. Explore products and fill your cart.
            </p>
            <Link
              href="/products"
              className="mt-7 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <ul className="rounded-xl border border-wm-border bg-white divide-y divide-wm-border/70">
              {items.map((item) => {
                const itemId = String(item._id ?? '')
                const href = toProductHref(item as unknown as { product?: { _id?: string; id?: string } | null })
                const title = toProductTitle(item as unknown as { product?: { title?: string; name?: string } | null })
                const imgRaw = (item.product as { images?: unknown[]; imageUrl?: string; image?: string } | null)?.images?.[0]
                  ?? (item.product as { imageUrl?: string; image?: string } | null)?.imageUrl
                  ?? (item.product as { imageUrl?: string; image?: string } | null)?.image
                const img = productImageUrl((imgRaw as string | undefined) ?? '')
                const qty = Math.max(1, Number(item.quantity) || 1)
                const unit = Number(item.price ?? 0)
                const lineTotal = unit * qty

                return (
                  <li key={itemId} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex flex-1 min-w-0 gap-3 sm:gap-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-wm-page border border-wm-border">
                        <img
                          src={img}
                          alt={title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const t = e.currentTarget
                            if (t.src.includes('/images/GoSellrIcon.png')) return
                            t.onerror = null
                            t.src = '/images/GoSellrIcon.png'
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        {href ? (
                          <Link href={href} className="font-semibold text-slate-900 hover:text-primary line-clamp-2">
                            {title}
                          </Link>
                        ) : (
                          <p className="font-semibold text-slate-900 line-clamp-2">{title}</p>
                        )}
                        <p className="mt-1 text-sm text-slate-600">{linePriceText(unit)} each</p>
                        {item.variantLabel ? <p className="mt-1 text-xs text-slate-500">{item.variantLabel}</p> : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 sm:justify-end">
                      <div className="inline-flex items-center rounded-full border border-wm-border bg-white">
                        <button
                          type="button"
                          className="h-8 w-8 text-sm font-semibold text-slate-700 hover:bg-wm-page rounded-l-full"
                          onClick={() => updateCartItem(itemId, Math.max(1, qty - 1))}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={qty}
                          onChange={(e) => {
                            const n = Math.max(1, parseInt(e.target.value || '1', 10) || 1)
                            updateCartItem(itemId, n)
                          }}
                          className="h-8 w-12 border-0 bg-transparent text-center text-sm font-medium text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          aria-label="Quantity"
                        />
                        <button
                          type="button"
                          className="h-8 w-8 text-sm font-semibold text-slate-700 hover:bg-wm-page rounded-r-full"
                          onClick={() => updateCartItem(itemId, qty + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <span className="w-24 text-right text-sm font-semibold text-slate-900">{linePriceText(lineTotal)}</span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(itemId)}
                        className="text-xs sm:text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="rounded-xl border border-wm-border bg-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-slate-600">{itemCount} item(s)</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">Total {linePriceText(total)}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => clearCart()}
                  className="inline-flex justify-center rounded-full border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Clear cart
                </button>
                <Link
                  href="/products"
                  className="inline-flex justify-center rounded-full border border-wm-border px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-wm-page"
                >
                  Keep shopping
                </Link>
                <button
                  type="button"
                  onClick={() => router.push(isAuthenticated ? '/checkout' : withReturnUrl('/login/customer', '/checkout'))}
                  className="inline-flex justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
                >
                  {isAuthenticated ? 'Proceed to checkout' : 'Login / Signup to checkout'}
                </button>
              </div>
            </div>

            {!isAuthenticated ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Sign in to place your order, then return here to checkout.
              </p>
            ) : null}
          </div>
        )}
      </main>

      <StorefrontFooter />
    </div>
  )
}
