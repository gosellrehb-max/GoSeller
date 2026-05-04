"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheck, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { type Product, getProductId } from "@/services/api";
import { recordProductView } from "@/utils/recentlyViewedProducts";
import { productImageUrl } from "@/utils/productImageUrl";
import {
  calculatePrices,
  getProductDiscountPercentLabel,
} from "@/utils/productDiscount";
import { productCardListingHeadline } from "@/utils/productDetailedTitle";
import {
  PriceWithSmallRs,
  StrikethroughPriceSmallRs,
} from "@/features/product/components/PriceWithSmallRs";
import {
  normalizeProductVariants,
  buildVariantKey,
  formatVariantLabel,
} from "@/utils/productVariants";
import NoResultsReturnHome from "@/features/marketplace/components/NoResultsReturnHome";
import { ProductStarRating } from "@/features/product/components/ProductStarRating";
import { ProductDetailBuyColumn } from "@/features/product/components/ProductDetailBuyColumn";
import { ProductDetailZoomImage } from "@/features/product/components/ProductDetailZoomImage";
import { ProductTabs } from "@/features/product/components/ProductTabs";
import { ProductAboutItem } from "@/features/product/components/ProductAboutItem";
import { ProductReviews } from "@/features/product/components/ProductReviews";
import { useMarketplaceProductQuery } from "@/features/marketplace/hooks/useMarketplaceQueries";
import { recordProductView as recordProductViewOnServer } from "@/features/marketplace/api/products";
import {
  isWishlistId,
  toggleWishlistId,
} from "@/utils/wishlist";
import { useWishlist } from "@/contexts/WishlistContext";
import { withReturnUrl } from "@/features/auth/utils/returnUrl";
import { useProductRatingStats } from "@/features/reviews/hooks/useReviews";

export default function MarketplaceProductDetailView() {
  const params = useParams();
  const productId = params?.productId as string;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { addToCart, isProductInCart } = useCart();
  const { ids: wishlistIds } = useWishlist();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyNowPending, setBuyNowPending] = useState(false);
  const serverTrackedProductIdsRef = useRef<Set<string>>(new Set());
  const [variantSelection, setVariantSelection] = useState<
    Record<string, string>
  >({});

  const {
    data: productData,
    isLoading,
    error: queryError,
  } = useMarketplaceProductQuery(productId, user?.role !== "seller");
  const product = productData ?? null;

  const { data: stats } = useProductRatingStats(productId);

  useEffect(() => {
    if (!product) return;
    setSelectedImage(0);
    const vid = getProductId(product);
    if (!vid) return;

    recordProductView(vid);
    if (!serverTrackedProductIdsRef.current.has(vid)) {
      serverTrackedProductIdsRef.current.add(vid);
      void recordProductViewOnServer(vid).catch(() => {
        // View tracking is non-critical; never disturb the product page UX.
      });
    }
  }, [product]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      setAddingToCart(true);
      const meta =
        variantRows.length > 0
          ? { variantKey: currentVariantKey, variantLabel: currentVariantLabel }
          : undefined;
      await addToCart(product, quantity, meta);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 1)) {
      setQuantity(newQuantity);
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedImage(index);
  };

  const galleryImages =
    product?.images && Array.isArray(product.images) ? product.images : [];
  const galleryCount = galleryImages.length;

  const goPrevImage = useCallback(() => {
    if (galleryCount <= 1) return;
    setSelectedImage((i) => (i - 1 + galleryCount) % galleryCount);
  }, [galleryCount]);

  const goNextImage = useCallback(() => {
    if (galleryCount <= 1) return;
    setSelectedImage((i) => (i + 1) % galleryCount);
  }, [galleryCount]);

  useEffect(() => {
    if (galleryCount <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrevImage();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNextImage();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [galleryCount, goPrevImage, goNextImage]);

  const variantRows = useMemo(
    () => (product ? normalizeProductVariants(product.variants) : []),
    [product],
  );

  useEffect(() => {
    if (!product || variantRows.length === 0) {
      setVariantSelection({});
      return;
    }
    setVariantSelection((prev) => {
      const next: Record<string, string> = {};
      for (const row of variantRows) {
        const prevVal = prev[row.name];
        next[row.name] =
          prevVal && row.options.includes(prevVal)
            ? prevVal
            : (row.options[0] ?? "");
      }
      return next;
    });
  }, [productId, variantRows]);

  const currentVariantKey =
    variantRows.length > 0 ? buildVariantKey(variantSelection) : "";
  const currentVariantLabel =
    variantRows.length > 0 ? formatVariantLabel(variantSelection) : "";

  const handleBuyNow = () => {
    if (!product) return;
    setBuyNowPending(true);
    if (!isAuthenticated) {
      const pk = String(
        (product as any)._id ?? (product as any).id ?? productId ?? "",
      );
      if (!pk) {
        setBuyNowPending(false);
        return;
      }
      router.push(
        `/login/customer?redirect=${encodeURIComponent(`/product/${pk}`)}`,
      );
      return;
    }
    const pk = String(
      (product as any)._id ?? (product as any).id ?? productId ?? "",
    );
    if (!pk) {
      setBuyNowPending(false);
      return;
    }
    const q = new URLSearchParams();
    q.set("buyNow", pk);
    q.set("qty", String(quantity));
    if (currentVariantLabel) q.set("vl", currentVariantLabel);
    router.push(`/checkout?${q.toString()}`);
  };

  const productPk = product
    ? String((product as any)._id ?? (product as any).id ?? productId ?? "")
    : "";
  
  const setWishlisted = useCallback(
    (next: boolean) => {
      if (!productPk) return;
      if (!isAuthenticated) {
        router.push(withReturnUrl('/login/customer', window.location.pathname));
        return;
      }
      const current = isWishlistId(productPk, wishlistIds);
      if (current === next) return;
      toggleWishlistId(productPk);
    },
    [productPk, wishlistIds, isAuthenticated, router],
  );

  const wishlisted = productPk ? isWishlistId(productPk, wishlistIds) : false;
  const alreadyInCart = productPk
    ? isProductInCart(
        productPk,
        variantRows.length > 0 ? currentVariantKey : undefined,
      )
    : false;

  if (user?.role === "seller") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">
            Seller account
          </h1>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            Product detail pages are for customers shopping the catalog. Manage
            your own listings from the seller dashboard.
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
      <div className="min-h-screen bg-white">
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-4 text-gray-600">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (queryError || !product) {
    return <NoResultsReturnHome term={productId || "this product"} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="relative w-full max-w-none mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 py-8">
        <div className="xl:pr-[calc(20rem+2rem)]">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
            <div className="space-y-4 md:col-span-5 xl:col-span-6">
              {(() => {
                const imgs = galleryImages;
                const n = imgs.length;
                const safeIdx = n > 0 ? Math.min(selectedImage, n - 1) : 0;
                const currentSrc = imgs[safeIdx];
                return (
                  <div className="flex flex-col md:flex-row gap-4 h-full">
                    {n > 1 && (
                      <div className="hidden md:flex flex-col gap-2 overflow-y-auto w-20 shrink-0 max-h-[520px] pr-1">
                        {imgs.map((image, index) => (
                          <button
                            key={index}
                            type="button"
                            onMouseEnter={() => handleImageClick(index)}
                            onClick={() => handleImageClick(index)}
                            className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                              safeIdx === index
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            <img
                              src={productImageUrl(image)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="relative flex-1 w-full overflow-hidden rounded-xl shadow-sm max-h-[520px]">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={safeIdx}
                          initial={{ opacity: 0.85 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0.85 }}
                          transition={{ duration: 0.2 }}
                          className="flex min-h-[280px] max-h-[520px] items-center justify-center"
                        >
                          <ProductDetailZoomImage
                            src={productImageUrl(currentSrc)}
                            alt={`${product.title} — photo ${safeIdx + 1} of ${n || 1}`}
                            className="w-full"
                            imgClassName="max-h-[520px] w-full object-contain object-center"
                          />
                        </motion.div>
                      </AnimatePresence>

                      {n > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={goPrevImage}
                            className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-800 shadow-md transition hover:bg-white"
                            aria-label="Previous image"
                          >
                            <FiChevronLeft className="h-6 w-6" />
                          </button>
                          <button
                            type="button"
                            onClick={goNextImage}
                            className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-800 shadow-md transition hover:bg-white"
                            aria-label="Next image"
                          >
                            <FiChevronRight className="h-6 w-6" />
                          </button>
                          <div
                            className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5 px-4"
                            role="tablist"
                            aria-label="Image carousel"
                          >
                            {imgs.map((_, index) => (
                              <button
                                key={index}
                                type="button"
                                role="tab"
                                aria-selected={safeIdx === index}
                                onClick={() => handleImageClick(index)}
                                className={`h-2 rounded-full transition-all ${
                                  safeIdx === index
                                    ? "w-6 bg-primary"
                                    : "w-2 bg-white/90 ring-1 ring-gray-300"
                                }`}
                                aria-label={`Show image ${index + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {n > 1 && (
                      <div className="flex md:hidden gap-2 overflow-x-auto pb-1 mt-2">
                        {imgs.map((image, index) => (
                          <button
                            key={index}
                            type="button"
                            onMouseEnter={() => handleImageClick(index)}
                            onClick={() => handleImageClick(index)}
                            className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                              safeIdx === index
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            <img
                              src={productImageUrl(image)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="min-w-0 space-y-6 md:col-span-4 xl:col-span-6">
              <div>
                <h1 className="mb-1.5 text-sm font-semibold leading-snug text-gray-900 sm:text-base">
                  {productCardListingHeadline(product)}
                </h1>
                <a
                  href="#reviews"
                  className="mt-1 flex w-fit items-center group transition-opacity"
                >
                  <ProductStarRating
                    value={stats?.average ?? 0}
                    sublabel={`${stats?.count ?? 0} review(s)`}
                    starClassName="h-[13px] w-[13px]"
                    className="text-[13px]"
                  />
                </a>
              </div>

              {(() => {
                const { finalPrice, originalPriceForDisplay, hasDiscount } =
                  calculatePrices(product);
                const [dollars, cents] = finalPrice.toFixed(2).split(".");
                return (
                  <div className="space-y-3">
                    {hasDiscount ? (
                      <span className="inline-flex w-fit items-center rounded-md bg-red-50 px-2.5 py-1 text-sm font-semibold text-red-800 ring-1 ring-red-100">
                        {getProductDiscountPercentLabel(product)}
                      </span>
                    ) : null}
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      {hasDiscount && originalPriceForDisplay != null ? (
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="mr-1 text-3xl font-bold leading-none tracking-tight text-[#107022] sm:text-4xl">
                            Now
                          </span>
                          <PriceWithSmallRs
                            dollars={dollars}
                            cents={cents}
                            toneClassName="text-[#107022]"
                            size="pdp"
                          />
                          <StrikethroughPriceSmallRs
                            amountFixed={originalPriceForDisplay.toFixed(2)}
                            className="ml-1 mt-1 text-lg font-bold text-gray-400 sm:text-xl"
                          />
                        </div>
                      ) : (
                        <PriceWithSmallRs
                          dollars={dollars}
                          cents={cents}
                          toneClassName="text-gray-900"
                          size="pdp"
                        />
                      )}
                    </div>
                  </div>
                );
              })()}

              {variantRows.length > 0 && (
                <div className="space-y-3">
                  {variantRows.map((row) => (
                    <div
                      key={row.name}
                      className="flex flex-row flex-nowrap items-center gap-3 min-w-0 w-full"
                      role="radiogroup"
                      aria-label={row.name}
                    >
                      <span className="text-sm font-medium text-gray-900 shrink-0">
                        {row.name}
                      </span>
                      <div className="flex flex-row flex-nowrap items-stretch gap-2 overflow-x-auto min-w-0 flex-1 pb-0.5 [-webkit-overflow-scrolling:touch]">
                        {row.options.map((opt) => {
                          const id = `variant-${row.name}-${opt}`.replace(
                            /\s+/g,
                            "-",
                          );
                          const selected = variantSelection[row.name] === opt;
                          return (
                            <label
                              key={opt}
                              htmlFor={id}
                              className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                                selected
                                  ? "border-primary bg-primary/10 text-gray-900 ring-2 ring-primary/25"
                                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                              }`}
                            >
                              <input
                                id={id}
                                type="radio"
                                name={`variant-${row.name}`}
                                value={opt}
                                checked={selected}
                                onChange={() =>
                                  setVariantSelection((prev) => ({
                                    ...prev,
                                    [row.name]: opt,
                                  }))
                                }
                                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary shrink-0"
                              />
                              <span className="whitespace-nowrap">{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                {product.stock > 0 ? (
                  <div className="flex items-center text-green-700">
                    <FiCheck className="mr-2 h-5 w-5 shrink-0" aria-hidden />
                    <span className="text-sm font-medium">In stock</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <FiX className="mr-2 h-5 w-5 shrink-0" aria-hidden />
                    <span className="text-sm font-medium">Out of stock</span>
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:col-span-3 md:block xl:hidden">
              <ProductDetailBuyColumn
                product={product}
                quantity={quantity}
                onQuantityChange={handleQuantityChange}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                addingToCart={addingToCart}
                buyNowPending={buyNowPending}
                alreadyInCart={alreadyInCart}
                stock={product.stock}
                wishlisted={wishlisted}
                onWishlistedChange={setWishlisted}
              />
            </div>
          </div>

          <div className="mt-12 border-t border-gray-200">
            <ProductTabs
              defaultTab="about"
              tabs={[
                {
                  id: "about",
                  label: "About Item",
                  content: <ProductAboutItem product={product} />,
                },
                {
                  id: "reviews",
                  label: "Reviews",
                  content: <ProductReviews productId={productPk} />,
                },
              ]}
            />
          </div>
        </div>

        <div className="mt-10 md:hidden">
          <ProductDetailBuyColumn
            product={product}
            quantity={quantity}
            onQuantityChange={handleQuantityChange}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            addingToCart={addingToCart}
            buyNowPending={buyNowPending}
            alreadyInCart={alreadyInCart}
            stock={product.stock}
            wishlisted={wishlisted}
            onWishlistedChange={setWishlisted}
          />
        </div>

        <div
          className="hidden xl:block fixed top-[12.5rem] z-30 w-80 overflow-visible right-4 sm:right-6 md:right-8 lg:right-10 xl:right-12 2xl:right-16"
          data-pdp-buy-dock
        >
          <ProductDetailBuyColumn
            product={product}
            quantity={quantity}
            onQuantityChange={handleQuantityChange}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            addingToCart={addingToCart}
            buyNowPending={buyNowPending}
            alreadyInCart={alreadyInCart}
            stock={product.stock}
            className="shadow-lg"
            wishlisted={wishlisted}
            onWishlistedChange={setWishlisted}
          />
        </div>
      </main>
    </div>
  );
}
