'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { ShieldCheck, Banknote, CreditCard, Smartphone, Loader2, CheckCircle2 } from 'lucide-react';
import { calculatePrices } from '@/utils/productDiscount';
import { formatPkr } from '@/utils/orderDisplay';
import { VERIFY_MESSAGES } from '@/features/marketplace/checkout/types/checkoutTypes';
import { useCheckout } from '@/features/marketplace/checkout/hooks/useCheckout';
import type { Product } from '@/services/api';

function PaymentVerifyOverlay({
  open,
  messageIndex,
  done,
}: {
  open: boolean;
  messageIndex: number;
  done: boolean;
}) {
  if (!open && !done) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="verify-title">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-8 py-10 flex flex-col items-center text-center">
          {!done ? (
            <>
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-[#00B207] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Loader2 className="w-7 h-7 text-[#00B207] animate-spin opacity-40" />
                </div>
              </div>
              <h2 id="verify-title" className="text-lg font-semibold text-gray-900 mb-2">Verifying payment</h2>
              <p className="text-sm text-gray-600 min-h-[3rem] transition-all duration-300">
                {VERIFY_MESSAGES[Math.min(messageIndex, VERIFY_MESSAGES.length - 1)]}
              </p>
              <div className="flex gap-1.5 mt-6 justify-center">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`h-2 w-2 rounded-full transition-colors ${messageIndex >= i ? 'bg-[#00B207]' : 'bg-gray-200'}`} />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-6">Please do not close this window</p>
            </>
          ) : (
            <>
              <div className="mb-5 rounded-full bg-emerald-50 p-4">
                <CheckCircle2 className="w-14 h-14 text-emerald-600" strokeWidth={2} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Payment verified</h2>
              <p className="text-sm text-gray-600">You can complete your order below.</p>
            </>
          )}
        </div>
        {done && <div className="h-1 w-full bg-gradient-to-r from-[#00B207] via-emerald-400 to-[#00B207] animate-pulse" />}
      </div>
    </div>
  );
}

function CheckoutContent() {
  const {
    cart,
    isLoading,
    isAuthenticated,
    buyNowProductId,
    buyNowVariantLabel,
    isBuyNow,
    form,
    submitting,
    error,
    success,
    buyProduct,
    buyProductLoading,
    paymentMethod,
    cardNumber,
    cardExpiry,
    cardCvv,
    cardName,
    walletPhone,
    paymentVerified,
    verifying,
    verifyMsgIndex,
    verifyDone,
    itemCount,
    buyLineTotal,
    total,
    effectiveBuyQty,
    canCheckout,
    inputClass,
    productTitle,
    showVerifyOverlay,
    canPlaceOrder,
    onChange,
    submit,
    handleVerifyPayment,
    setPaymentMethod,
    setCardNumber,
    setCardExpiry,
    setCardCvv,
    setCardName,
    setWalletPhone,
  } = useCheckout();

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <PaymentVerifyOverlay open={showVerifyOverlay} messageIndex={verifyMsgIndex} done={verifyDone} />
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-base font-semibold text-gray-900 hover:text-[#00B207]">← GoSeller</Link>
          <div className="flex items-center gap-4 text-sm">
            {!isBuyNow && <Link href="/cart" className="text-gray-700 hover:text-[#00B207]">Cart</Link>}
            <Link href="/products" className="text-gray-700 hover:text-[#00B207]">Continue shopping</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 box-border min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4 mb-6 min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{isBuyNow ? 'Buy now — checkout' : 'Checkout'}</h1>
            <p className="text-sm text-gray-500 mt-1">Shipping, payment, and order summary</p>
          </div>
          {isBuyNow && buyNowProductId ? (
            <Link href={`/product/${encodeURIComponent(buyNowProductId)}`} className="inline-flex items-center justify-center shrink-0 text-sm font-medium text-orange-600 hover:text-orange-700 border border-orange-200 rounded-lg px-4 py-2 hover:bg-orange-50 transition-colors w-full sm:w-auto">← Back to product</Link>
          ) : (
            <Link href="/cart" className="inline-flex items-center justify-center shrink-0 text-sm font-medium text-orange-600 hover:text-orange-700 border border-orange-200 rounded-lg px-4 py-2 hover:bg-orange-50 transition-colors w-full sm:w-auto">← Back to cart</Link>
          )}
        </div>

        {isBuyNow && buyProductLoading && <div className="mb-6 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">Loading product…</div>}
        {isBuyNow && !buyProductLoading && buyNowProductId && !buyProduct && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Product not found. <Link href="/products" className="font-medium underline">Browse products</Link>
          </div>
        )}
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 break-words">{error}</div>}
        {success && <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{success}</div>}

        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:items-start gap-6 lg:gap-8 min-w-0">
          <aside className="order-1 lg:order-2 lg:col-span-4 xl:col-span-4 w-full min-w-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 lg:sticky lg:top-[4.5rem]">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order summary</h2>
              {isBuyNow && buyProduct && (
                <ul className="mb-4 max-h-48 sm:max-h-56 overflow-y-auto space-y-2 border-b border-gray-100 pb-4 -mx-1 px-1">
                  <li className="flex justify-between gap-3 text-sm text-gray-700 min-w-0">
                    <span className="truncate min-w-0 pr-2">
                      <span className="block">{productTitle} <span className="text-gray-500 whitespace-nowrap">×{effectiveBuyQty}</span></span>
                      {buyNowVariantLabel ? <span className="block text-xs text-gray-500 mt-0.5">{buyNowVariantLabel}</span> : null}
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">{formatPkr(buyLineTotal)}</span>
                  </li>
                </ul>
              )}
              {!isBuyNow && cart?.items?.length > 0 && (
                <ul className="mb-4 max-h-48 sm:max-h-56 overflow-y-auto space-y-2 border-b border-gray-100 pb-4 -mx-1 px-1">
                  {(cart.items as any[]).map((it: any) => {
                    const title = it?.product?.title ?? it?.product?.name ?? 'Item';
                    const qty = Number(it?.quantity) || 0;
                    const unit = it?.product && typeof it.product === 'object' && it.product.price != null
                      ? calculatePrices(it.product as Product).finalPrice
                      : Number(it?.price) || 0;
                    const line = unit * qty;
                    return (
                      <li key={String(it._id ?? it.id)} className="flex justify-between gap-3 text-sm text-gray-700 min-w-0">
                        <span className="truncate min-w-0 pr-2">
                          <span className="block">{title} <span className="text-gray-500 whitespace-nowrap">×{qty}</span></span>
                          {it.variantLabel ? <span className="block text-xs text-gray-500 mt-0.5">{it.variantLabel}</span> : null}
                        </span>
                        <span className="shrink-0 font-medium tabular-nums">{formatPkr(line)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4 text-gray-700"><span>Items</span><span className="tabular-nums">{itemCount}</span></div>
                <div className="flex justify-between gap-4 text-gray-700"><span>Subtotal</span><span className="tabular-nums">{formatPkr(total)}</span></div>
                <div className="flex justify-between gap-4 text-gray-700"><span>Shipping</span><span className="tabular-nums">{formatPkr(0)}</span></div>
                <div className="flex justify-between gap-4 text-gray-700"><span>Tax</span><span className="tabular-nums">{formatPkr(0)}</span></div>
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between gap-4 items-baseline">
                <span className="text-base font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900 tabular-nums">{formatPkr(total)}</span>
              </div>
              {!isBuyNow && !cart?.items?.length && <p className="mt-4 text-sm text-gray-600">Your cart is empty. Add products before checkout.</p>}
              {isBuyNow && !buyProduct && !buyProductLoading && <p className="mt-4 text-sm text-gray-600">Unable to load product for Buy now.</p>}
            </div>
          </aside>

          <div className="order-2 lg:order-1 lg:col-span-8 xl:col-span-8 w-full min-w-0 space-y-6">
            <form id="checkout-form" onSubmit={submit} className="space-y-6 w-full min-w-0 box-border">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-5 w-full min-w-0 box-border">
                <h2 className="text-lg font-semibold text-gray-900">Shipping details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
                  <div className="min-w-0 sm:col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="co-first">First name</label><input id="co-first" value={form.firstName} onChange={(e) => onChange('firstName', e.target.value)} className={inputClass} required autoComplete="given-name" /></div>
                  <div className="min-w-0 sm:col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="co-last">Last name</label><input id="co-last" value={form.lastName} onChange={(e) => onChange('lastName', e.target.value)} className={inputClass} required autoComplete="family-name" /></div>
                  <div className="min-w-0 sm:col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="co-email">Email</label><input id="co-email" type="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} className={inputClass} required autoComplete="email" /></div>
                  <div className="min-w-0 sm:col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="co-phone">Phone</label><input id="co-phone" type="tel" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} className={inputClass} required autoComplete="tel" /></div>
                </div>
                <div className="min-w-0"><label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="co-street">Street address</label><input id="co-street" value={form.address.street} onChange={(e) => onChange('address.street', e.target.value)} className={inputClass} required autoComplete="street-address" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full min-w-0">
                  <div className="min-w-0 sm:col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="co-city">City</label><input id="co-city" value={form.address.city} onChange={(e) => onChange('address.city', e.target.value)} className={inputClass} required autoComplete="address-level2" /></div>
                  <div className="min-w-0 sm:col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="co-state">State</label><input id="co-state" value={form.address.state} onChange={(e) => onChange('address.state', e.target.value)} className={inputClass} required autoComplete="address-level1" /></div>
                  <div className="min-w-0 sm:col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="co-zip">Zip code</label><input id="co-zip" value={form.address.zipCode} onChange={(e) => onChange('address.zipCode', e.target.value)} className={inputClass} required autoComplete="postal-code" /></div>
                </div>
                <div className="min-w-0"><label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="co-country">Country (optional)</label><input id="co-country" value={form.address.country ?? ''} onChange={(e) => onChange('address.country', e.target.value)} className={inputClass} autoComplete="country-name" /></div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4 w-full min-w-0">
                <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-[#00B207]" /><h2 className="text-lg font-semibold text-gray-900">Payment method</h2></div>
                <p className="text-sm text-gray-500">Cash on delivery needs no card. For card or wallets, use any test details — we simulate bank verification before you can place the order.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    { id: 'cod' as const, label: 'Cash on delivery', sub: 'Pay when you receive', icon: Banknote },
                    { id: 'card' as const, label: 'Credit / Debit card', sub: 'Visa, Mastercard…', icon: CreditCard },
                    { id: 'jazzcash' as const, label: 'JazzCash', sub: 'Mobile account', icon: Smartphone },
                    { id: 'easypaisa' as const, label: 'Easypaisa', sub: 'Mobile account', icon: Smartphone },
                  ] as const).map(({ id, label, sub, icon: Icon }) => (
                    <button key={id} type="button" onClick={() => setPaymentMethod(id)} className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${paymentMethod === id ? 'border-[#00B207] bg-[#00B207]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${paymentMethod === id ? 'text-[#00B207]' : 'text-gray-500'}`} />
                      <span><span className="block font-medium text-gray-900">{label}</span><span className="block text-xs text-gray-500 mt-0.5">{sub}</span></span>
                    </button>
                  ))}
                </div>
                {paymentMethod === 'cod' && <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-700">No payment details required. You’ll pay the rider or courier in cash when your order arrives.</div>}
                {paymentMethod === 'card' && (
                  <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Card number</label><input type="text" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className={inputClass} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Expiry</label><input type="text" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} className={inputClass} /></div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">CVV</label><input type="text" inputMode="numeric" placeholder="123" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} className={inputClass} /></div>
                    </div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Name on card</label><input type="text" autoComplete="cc-name" placeholder="As on card" value={cardName} onChange={(e) => setCardName(e.target.value)} className={inputClass} /></div>
                  </div>
                )}
                {(paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">{paymentMethod === 'jazzcash' ? 'JazzCash' : 'Easypaisa'} mobile number</label>
                    <input type="tel" inputMode="numeric" placeholder="03XXXXXXXXX" value={walletPhone} onChange={(e) => setWalletPhone(e.target.value)} className={inputClass} />
                  </div>
                )}
                {paymentMethod !== 'cod' && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <button type="button" disabled={verifying || !canCheckout} onClick={handleVerifyPayment} className="inline-flex items-center justify-center rounded-lg bg-slate-800 text-white px-6 py-2.5 text-sm font-medium hover:bg-slate-900 disabled:opacity-50">{verifying ? 'Verifying…' : 'Verify payment'}</button>
                    {paymentVerified && <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"><CheckCircle2 className="w-4 h-4" />Ready to place order</span>}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <button type="submit" disabled={!canPlaceOrder || submitting} className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-8 py-3 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:opacity-95 transition-opacity">{submitting ? 'Placing order…' : 'Place order'}</button>
                {!paymentVerified && paymentMethod !== 'cod' && <span className="text-xs text-gray-500">Verify payment above before placing your order.</span>}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPageFeature() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">Loading checkout…</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
