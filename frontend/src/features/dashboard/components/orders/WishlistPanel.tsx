"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProductId } from "@/services/api";
import { removeWishlistId } from "@/utils/wishlist";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { getWishlistProductsByIds } from "@/features/dashboard/api/orders";
import { dashboardQueryKeys } from "@/features/dashboard/queries/queryKeys";

export function WishlistPanel({
  wishlistIds,
  isLoading,
}: {
  wishlistIds: string[];
  isLoading?: boolean;
}) {
  const router = useRouter();
  const { addToCart, isProductInCart } = useCart();
  const [movingToCart, setMovingToCart] = useState(false);
  const { data: rows = [], isLoading: loading } = useQuery({
    queryKey: dashboardQueryKeys.wishlist.products(wishlistIds.join(",")),
    queryFn: async () => getWishlistProductsByIds(wishlistIds),
    enabled: wishlistIds.length > 0,
  });

  const moveAllToCart = async () => {
    if (rows.length === 0) return;
    setMovingToCart(true);
    try {
      let movedCount = 0;
      for (const { id, product } of rows) {
        const pid = getProductId(product);
        if (!pid) continue;
        if (isProductInCart(pid)) {
          removeWishlistId(id);
          movedCount += 1;
          continue;
        }
        try {
          await addToCart(product, 1);
          removeWishlistId(id);
          movedCount += 1;
        } catch {
          continue;
        }
      }
      if (movedCount > 0) {
        router.push("/checkout");
      }
    } finally {
      setMovingToCart(false);
    }
  };

  if (isLoading && wishlistIds.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-600">
        <p className="mb-4">Loading your wishlist…</p>
      </div>
    );
  }

  if (wishlistIds.length === 0)
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-600">
        <p className="mb-4">Your wishlist is empty.</p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 transition-colors"
        >
          Browse products
        </Link>
      </div>
    );

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-600">
        <p className="mb-4">Loading your saved items…</p>
      </div>
    );
  }

  if (rows.length === 0)
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-gray-600">
        <p className="mb-3">Saved items could not be loaded.</p>
        <button
          type="button"
          onClick={() => wishlistIds.forEach((id) => removeWishlistId(id))}
          className="text-sm font-medium text-primary hover:underline"
        >
          Clear wishlist
        </button>
      </div>
    );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {rows.length} saved item(s)
          </p>
          <p className="text-xs text-gray-500">
            Move items to cart before checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={moveAllToCart}
          disabled={movingToCart}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {movingToCart ? "Moving…" : "Move all to cart & checkout"}
        </button>
      </div>
      <ul className="space-y-4">
        {rows.map(({ id, product }) => {
          const pid = getProductId(product);
          const img = product.images?.[0];
          const inCart = pid ? isProductInCart(pid) : false;
          return (
            <li
              key={id}
              className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <Link
                href={`/product/${pid}`}
                className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100"
              >
                {img ? (
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                    No image
                  </span>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${pid}`}
                  className="font-semibold text-gray-900 line-clamp-2 hover:text-primary"
                >
                  {product.title}
                </Link>
                <p className="mt-1 text-sm font-medium text-gray-800">
                  ${Number(product.price).toFixed(2)}
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      await addToCart(product, 1);
                      removeWishlistId(id);
                    }}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {inCart ? "Already in cart" : "Move to cart"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeWishlistId(id)}
                    className="text-sm text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
