'use client';

import React, { useCallback, useId, useState } from 'react';
import {
  FiCheck,
  FiChevronRight,
  FiHeart,
  FiMapPin,
  FiMinus,
  FiPlus,
  FiRefreshCw,
  FiLoader,
  FiShare2,
  FiShield,
  FiShoppingCart,
  FiTruck,
} from 'react-icons/fi';
import type { Product } from '@/services/api';
import { getSellerDisplayName, getSellerInitial } from '@/utils/sellerDisplay';

const TRUST_MICRO = {
  delivery: 'Expected within a week',
  returns: 'See return window at checkout. Refunds after we receive your item.',
  security:
    'Safe payments: we do not share your personal details without consent. Secure account: industry-standard protection.',
} as const;

type ProductDetailBuyColumnProps = {
  product: Product;
  quantity: number;
  onQuantityChange: (n: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  addingToCart: boolean;
  buyNowPending?: boolean;
  alreadyInCart: boolean;
  stock: number;
  className?: string;
  wishlisted?: boolean;
  onWishlistedChange?: (next: boolean) => void;
};

export function ProductDetailBuyColumn({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  addingToCart,
  buyNowPending = false,
  alreadyInCart,
  stock,
  className = '',
  wishlisted: wishlistedProp,
  onWishlistedChange,
}: ProductDetailBuyColumnProps) {
  const [wishlistedInternal, setWishlistedInternal] = useState(false);
  const wishlisted = wishlistedProp ?? wishlistedInternal;
  const setWishlisted = onWishlistedChange ?? setWishlistedInternal;
  const qtyId = useId();
  const sellerPopoverId = useId();

  const handleShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = product.title || 'Product';
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
  }, [product.title]);

  const seller = product.sellerId;
  const sellerName = getSellerDisplayName(seller);

  return (
    <aside
      className={`h-fit space-y-0 rounded-lg border border-gray-200 bg-white p-3 text-[13px] shadow-sm ${className}`.trim()}
    >
      <section className="relative border-b border-gray-100 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Sold by</p>
        <div className="group relative mt-1">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md py-0.5 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-describedby={sellerPopoverId}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {getSellerInitial(seller)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold leading-tight text-gray-900">{sellerName}</p>
              {seller?.verified ? (
                <span className="text-[10px] font-medium text-blue-700">Verified</span>
              ) : null}
            </div>
            <FiChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          </button>

          <div
            id={sellerPopoverId}
            role="tooltip"
            className="absolute left-0 right-0 top-full z-[60] pt-1 opacity-0 invisible transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
          >
            <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg ring-1 ring-black/5">
              <div className="flex items-start gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {getSellerInitial(seller)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{sellerName}</p>
                  <div className="mt-1.5 space-y-1 text-gray-600">
                    {seller?.location ? (
                      <p className="flex items-center gap-1.5 text-[11px]">
                        <FiMapPin className="h-3 w-3 shrink-0 text-gray-400" aria-hidden />
                        {seller.location}
                      </p>
                    ) : null}
                    {seller?.verified ? (
                      <p className="flex items-center gap-1 text-[11px] text-blue-800">
                        <FiShield className="h-3 w-3" aria-hidden />
                        Verified on GoSellr
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-2.5 border-b border-gray-100 py-3 text-[11px] leading-snug text-gray-500">
        <div>
          <p className="flex items-center gap-1.5 font-semibold text-gray-900">
            <FiTruck className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <span>Secure shipping</span>
          </p>
          <p className="mt-0.5 pl-5 text-[11px] text-gray-500">Delivery: {TRUST_MICRO.delivery}</p>
        </div>

        <div>
          <p className="flex items-center gap-1.5 font-semibold text-gray-900">
            <FiRefreshCw className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <span>Return &amp; refund policy</span>
          </p>
          <p className="mt-0.5 line-clamp-2 pl-5 text-[11px] text-gray-500">{TRUST_MICRO.returns}</p>
        </div>

        <div>
          <p className="flex items-center gap-1.5 font-semibold text-gray-900">
            <FiShield className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <span>Security &amp; privacy</span>
          </p>
          <p className="mt-0.5 line-clamp-2 pl-5 text-[11px] text-gray-500">{TRUST_MICRO.security}</p>
        </div>
      </section>

      <section className="space-y-2.5 pt-3">
        {stock > 0 ? (
          <>
            <div>
              <label htmlFor={qtyId} className="mb-1 block text-xs font-semibold text-gray-900">
                Quantity
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="rounded border border-gray-300 bg-gray-50 p-1.5 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Decrease quantity"
                >
                  <FiMinus className="h-3.5 w-3.5" />
                </button>
                <span
                  id={qtyId}
                  className="min-w-[2rem] text-center text-base font-semibold tabular-nums text-gray-900"
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onQuantityChange(quantity + 1)}
                  disabled={quantity >= stock}
                  className="rounded border border-gray-300 bg-gray-50 p-1.5 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Increase quantity"
                >
                  <FiPlus className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1 text-[10px] text-gray-500">Max. {stock} pcs available</p>
            </div>

            <button
              type="button"
              onClick={onBuyNow}
              disabled={buyNowPending}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {buyNowPending ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin" aria-hidden />
                  <span>Redirecting…</span>
                </>
              ) : (
                'Buy now'
              )}
            </button>

            <button
              type="button"
              onClick={onAddToCart}
              disabled={addingToCart}
              className={`flex w-full items-center justify-center gap-2 rounded-md border border-gray-900 bg-white py-2.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                alreadyInCart && !addingToCart
                  ? 'border-emerald-700 text-emerald-800'
                  : 'text-gray-900 hover:bg-gray-50'
              }`}
            >
              {alreadyInCart && !addingToCart ? (
                <FiCheck className="h-4 w-4" aria-hidden />
              ) : (
                <FiShoppingCart className="h-4 w-4" aria-hidden />
              )}
              <span>
                {addingToCart
                  ? 'Adding…'
                  : alreadyInCart
                    ? 'Added — add more'
                    : 'Add to cart'}
              </span>
            </button>
          </>
        ) : (
          <p className="rounded-md bg-red-50 px-2 py-1.5 text-center text-xs font-medium text-red-800">
            Out of stock
          </p>
        )}

        <div className="flex gap-2 border-t border-gray-100 pt-2.5">
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-1.5 rounded border border-gray-200 bg-gray-50 py-2 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            <FiShare2 className="h-3.5 w-3.5" aria-hidden />
            Share
          </button>
          <button
            type="button"
            onClick={() => setWishlisted(!wishlisted)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded border py-2 text-[11px] font-medium transition-colors ${
              wishlisted
                ? 'border-red-200 bg-red-50 text-red-600'
                : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
            aria-pressed={wishlisted}
          >
            <FiHeart className={`h-3.5 w-3.5 ${wishlisted ? 'fill-current' : ''}`} aria-hidden />
            Wishlist
          </button>
        </div>
      </section>
    </aside>
  );
}
