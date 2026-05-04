"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiCheck, FiShoppingCart, FiStar } from "react-icons/fi";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { type Product, getProductId } from "@/services/api";
import {
  CATEGORY_DESCRIPTIONS,
  CATEGORY_SLUG_MAPPING,
} from "@/config/categories";
import { resolveProductPrimaryImage } from "@/utils/productImageUrl";
import {
  PRODUCT_CARD_DETAILED_TITLE_CLASSNAME,
  productCardListingHeadline,
} from "@/utils/productDetailedTitle";
import { calculatePrices } from "@/utils/productDiscount";
import {
  PriceWithSmallRs,
  StrikethroughPriceSmallRs,
} from "@/features/product/components/PriceWithSmallRs";
import NoResultsReturnHome from "@/features/marketplace/components/NoResultsReturnHome";
import StorefrontFooter from "@/components/layout/StorefrontFooter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getMarketplaceProductDetailQueryOptions,
  useMarketplaceCategoryProductsQuery,
} from "@/features/marketplace/hooks/useMarketplaceQueries";
import { WishlistToggleButton } from "@/components/ui/WishlistToggleButton";
import { mailtoSupportHref } from "@/lib/supportContact";

export default function MarketplaceCategoryView() {
  const queryClient = useQueryClient();
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const hasNextPageRef = React.useRef(false);
  const isFetchingNextPageRef = React.useRef(false);
  const fetchNextPageRef = React.useRef<(() => Promise<unknown>) | null>(null);
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const [sortBy, setSortBy] = useState("createdAt");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | undefined>(
    undefined,
  );
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | undefined>(
    undefined,
  );
  const limit = 12;
  const { addToCart, isProductInCart } = useCart();
  const { user } = useAuth();
  const {
    products,
    pagination,
    validCategory,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useMarketplaceCategoryProductsQuery({
    slug,
    page: 1,
    limit,
    sortBy,
    minPrice: appliedMinPrice,
    maxPrice: appliedMaxPrice,
    enabled: user?.role !== "seller",
  });
  const applyPriceFilter = () => {
    const min = minPriceInput.trim() === "" ? undefined : Number(minPriceInput);
    const max = maxPriceInput.trim() === "" ? undefined : Number(maxPriceInput);
    setAppliedMinPrice(Number.isFinite(min) ? min : undefined);
    setAppliedMaxPrice(Number.isFinite(max) ? max : undefined);
  };
  const clearPriceFilter = () => {
    setMinPriceInput("");
    setMaxPriceInput("");
    setAppliedMinPrice(undefined);
    setAppliedMaxPrice(undefined);
  };

  React.useEffect(() => {
    hasNextPageRef.current = Boolean(hasNextPage);
    isFetchingNextPageRef.current = isFetchingNextPage;
    fetchNextPageRef.current = fetchNextPage;
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (!hasNextPageRef.current) return;
        if (isFetchingNextPageRef.current) return;
        void fetchNextPageRef.current?.();
      },
      { root: null, rootMargin: "300px 0px", threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product, 1);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    }
  };

  const handleProductClick = (product: Product) => {
    const id = getProductId(product);
    if (!id) return;
    router.push(`/product/${id}`);
  };
  const prefetchProductDetail = React.useCallback(
    (id: string) => {
      void queryClient.prefetchQuery(
        getMarketplaceProductDetailQueryOptions(id),
      );
    },
    [queryClient],
  );

  if (user?.role === "seller") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">
            Seller account
          </h1>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            Category browsing is for customers. Use your seller dashboard to
            manage products.
          </p>
          <button
            type="button"
            onClick={() => router.push("/seller")}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#00966D] px-6 py-3 text-sm font-semibold text-white hover:bg-[#007d5b]"
          >
            Go to seller dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (!slug || !validCategory) {
    return <NoResultsReturnHome term={slug || "category"} />;
  }

  const categoryName =
    CATEGORY_SLUG_MAPPING[slug as keyof typeof CATEGORY_SLUG_MAPPING];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {categoryName}
          </h1>
          <p className="text-gray-600">
            {
              CATEGORY_DESCRIPTIONS[
                categoryName as keyof typeof CATEGORY_DESCRIPTIONS
              ]
            }
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {(error as Error).message || "Failed to fetch products"}
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-900">
              {pagination.total} products found
            </span>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Min price
              </label>
              <input
                type="number"
                min="0"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Max price
              </label>
              <input
                type="number"
                min="0"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="10000"
              />
            </div>
            <button
              type="button"
              onClick={applyPriceFilter}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-600"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={clearPriceFilter}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
              }}
              className="border border-gray-300 rounded-lg pl-4 pr-8 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="createdAt">Newest First</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
            </select>
          </div>
        </div>

        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product, idx) => {
                const headline = productCardListingHeadline(product);
                return (
                  <div
                    key={getProductId(product) || `product-${idx}`}
                    className="wm-shelf-card flex flex-col h-full bg-white relative group border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="relative bg-[#f3f3f3] overflow-hidden aspect-square">
                      <img
                        src={resolveProductPrimaryImage(product)}
                        alt={headline}
                        className="wm-product-image group-hover:scale-[1.02] transition-transform w-full h-full object-cover cursor-pointer"
                        onMouseEnter={() => {
                          const id = getProductId(product);
                          if (!id) return;
                          prefetchProductDetail(id);
                        }}
                        onClick={() => handleProductClick(product)}
                      />
                      {(() => {
                        const {
                          hasDiscount,
                          originalPriceForDisplay,
                          finalPrice,
                        } = calculatePrices(product);
                        if (!hasDiscount || !originalPriceForDisplay)
                          return null;
                        const pct = Math.round(
                          (1 - finalPrice / originalPriceForDisplay) * 100,
                        );
                        return pct > 0 ? (
                          <span className="absolute top-2 left-2 z-[2] rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm bg-[#e31837] text-white">
                            {pct}% OFF
                          </span>
                        ) : null;
                      })()}
                      <WishlistToggleButton
                        productId={getProductId(product)}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow z-[2] hover:bg-white transition-colors"
                        iconClassName="w-4 h-4"
                      />
                    </div>
                    <div className="p-3 flex flex-col justify-between flex-1">
                      <p
                        className={`${PRODUCT_CARD_DETAILED_TITLE_CLASSNAME} min-h-[2.35rem] cursor-pointer group-hover:underline`}
                        title={headline}
                        onMouseEnter={() => {
                          const id = getProductId(product);
                          if (!id) return;
                          prefetchProductDetail(id);
                        }}
                        onClick={() => handleProductClick(product)}
                      >
                        {headline}
                      </p>
                      <div className="flex items-center gap-1 mt-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`w-3 h-3 ${i < Math.floor(product.rating?.average || 0) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                          />
                        ))}
                        <span className="text-xs text-slate-500 ml-0.5">
                          ({product.rating?.count || 0})
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0 min-h-[32px]">
                        {(() => {
                          const {
                            finalPrice,
                            originalPriceForDisplay,
                            hasDiscount,
                          } = calculatePrices(product);
                          const [dollars, cents] = finalPrice
                            .toFixed(2)
                            .split(".");
                          return hasDiscount &&
                            originalPriceForDisplay != null ? (
                            <div className="flex items-baseline flex-wrap">
                              <span className="text-xl font-bold text-[#107022] mr-1 leading-none tracking-tight">
                                Now
                              </span>
                              <PriceWithSmallRs
                                dollars={dollars}
                                cents={cents}
                                toneClassName="text-[#107022]"
                              />
                              <StrikethroughPriceSmallRs
                                amountFixed={originalPriceForDisplay.toFixed(2)}
                                className="text-[11px] text-wm-muted ml-1.5 mt-0.5"
                              />
                            </div>
                          ) : (
                            <div className="flex items-baseline flex-wrap">
                              <PriceWithSmallRs
                                dollars={dollars}
                                cents={cents}
                                toneClassName="text-wm-ink"
                              />
                            </div>
                          );
                        })()}
                      </div>
                      {(() => {
                        const pid = getProductId(product);
                        const inCart = pid ? isProductInCart(pid) : false;
                        return (
                          <button
                            type="button"
                            onClick={() => !inCart && handleAddToCart(product)}
                            disabled={inCart || product.stock === 0}
                            className={`mt-2 w-full text-xs font-semibold py-2 rounded-[20px] ${
                              inCart
                                ? "bg-emerald-600 text-white"
                                : "border border-wm-ink text-wm-ink hover:bg-wm-page"
                            } disabled:opacity-60 transition-colors bg-white`}
                          >
                            {inCart ? (
                              <span className="flex items-center justify-center gap-1">
                                <FiCheck className="w-3.5 h-3.5" /> In cart
                              </span>
                            ) : product.stock === 0 ? (
                              "Out of stock"
                            ) : (
                              "+ Add"
                            )}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
            <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
            {isFetchingNextPage ? (
              <div
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4"
                aria-hidden
              >
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-56 bg-gray-200 animate-pulse rounded-xl"
                  />
                ))}
              </div>
            ) : null}
            {hasNextPage ? (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                >
                  {isFetchingNextPage ? "Loading…" : "Load more"}
                </button>
              </div>
            ) : (
              <div className="mt-6 text-center text-sm text-gray-500">
                No more products
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FiShoppingCart className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600">
              No products available in this category yet.
            </p>
          </div>
        )}
      </div>

      <section
        className="w-full border-t border-b border-primary-900/30 bg-primary-50/80 py-10 sm:py-12 px-4 mt-auto"
        aria-labelledby="feedback-cta-heading"
      >
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center gap-4">
          <p
            id="feedback-cta-heading"
            className="text-base sm:text-lg font-medium text-wm-ink"
          >
            We&apos;d love to hear what you think!
          </p>
          <a
            href={mailtoSupportHref("GoSellr — Feedback")}
            className="inline-flex items-center justify-center rounded-full border-2 border-wm-ink bg-white px-8 py-2.5 text-sm font-bold text-wm-ink shadow-sm hover:bg-wm-page transition-colors"
          >
            Give feedback
          </a>
        </div>
      </section>

      <StorefrontFooter />
    </div>
  );
}
