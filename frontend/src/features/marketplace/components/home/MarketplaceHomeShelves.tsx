"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiCheck, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useCart } from "@/contexts/CartContext";
import { getProductId, type Product } from "@/services/api";
import { resolveProductPrimaryImage } from "@/utils/productImageUrl";
import {
  calculatePrices,
  getProductDiscountPercentLabel,
} from "@/utils/productDiscount";
import {
  PRODUCT_CARD_DETAILED_TITLE_CLASSNAME,
  productCardListingHeadline,
} from "@/utils/productDetailedTitle";
import {
  PriceWithSmallRs,
  StrikethroughPriceSmallRs,
} from "@/features/product/components/PriceWithSmallRs";
import { getMarketplaceProductDetailQueryOptions } from "@/features/marketplace/hooks/useMarketplaceQueries";
import { WishlistToggleButton } from "@/components/ui/WishlistToggleButton";

const PRODUCT_IMAGE_FALLBACK = "/images/GoSellrIcon.png";
export type BadgeKind =
  | "featured"
  | "discount"
  | "deal"
  | "trending"
  | "recent"
  | "new"
  | "none";

function shelfBadgeClasses(kind: BadgeKind): string {
  switch (kind) {
    case "featured":
      return "bg-[#ffc220] text-wm-ink";
    case "discount":
      return "bg-[#e31837] text-white";
    case "deal":
      return "bg-primary text-white";
    case "trending":
      return "bg-orange-500 text-white";
    case "recent":
      return "bg-slate-700 text-white";
    case "new":
      return "bg-emerald-600 text-white";
    default:
      return "";
  }
}

function shelfBadgeLabel(kind: BadgeKind, p: Product): string | null {
  if (kind === "discount") {
    const { hasDiscount } = calculatePrices(p);
    if (!hasDiscount) return null;
    return getProductDiscountPercentLabel(p);
  }
  if (kind === "featured") return "Featured";
  if (kind === "deal") return "Deal";
  if (kind === "trending") return "Trending";
  if (kind === "recent") return "Recent";
  if (kind === "new") return "New";
  return null;
}

function isDummyProductId(id: string): boolean {
  return id.startsWith("dummy-");
}

export function ProductShelfCard({
  p,
  badgeKind,
  variant = "default",
  minimalLgColumns = 6,
}: {
  p: Product;
  badgeKind: BadgeKind;
  variant?: "default" | "minimal";
  minimalLgColumns?: 3 | 6;
}) {
  const queryClient = useQueryClient();
  const { addToCart, isProductInCart: isInCart } = useCart();
  const id = getProductId(p);
  const img = resolveProductPrimaryImage(p);
  const headline = productCardListingHeadline(p);
  const dummy = isDummyProductId(id);
  const inCart = !dummy && id ? isInCart(id) : false;
  const badgeText = shelfBadgeLabel(badgeKind, p);
  const badgeClass = shelfBadgeClasses(badgeKind);
  const minimal = variant === "minimal";

  const { finalPrice, originalPriceForDisplay, hasDiscount } =
    calculatePrices(p);
  const [dollars, cents] = finalPrice.toFixed(2).split(".");

  const minimalLgWidthClass =
    minimalLgColumns === 3
      ? "lg:w-[calc((100%-1.5rem)/3)] lg:max-w-[calc((100%-1.5rem)/3)]"
      : "lg:w-[calc((100%-3.75rem)/6)] lg:max-w-[calc((100%-3.75rem)/6)]";

  const shellClass = minimal
    ? `snap-start shrink-0 w-[140px] flex-none sm:w-[148px] lg:min-w-0 ${minimalLgWidthClass}`
    : "snap-start shrink-0 w-[148px] sm:w-[168px] wm-shelf-card";

  const prefetchProductDetail = useCallback(
    (productId: string) => {
      void queryClient.prefetchQuery(
        getMarketplaceProductDetailQueryOptions(productId),
      );
    },
    [queryClient],
  );

  if (minimal) {
    return (
      <div className={shellClass}>
        <div className="relative aspect-square w-full overflow-hidden bg-white">
          <Link
            href={dummy ? "/products" : id ? `/product/${id}` : "#"}
            onMouseEnter={() => {
              if (!id || dummy) return;
              prefetchProductDetail(id);
            }}
            onFocus={() => {
              if (!id || dummy) return;
              prefetchProductDetail(id);
            }}
            className="block h-full w-full"
          >
            <img
              src={img}
              alt=""
              className="h-full w-full object-contain object-center p-1"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.includes(PRODUCT_IMAGE_FALLBACK)) return;
                target.onerror = null;
                target.src = PRODUCT_IMAGE_FALLBACK;
              }}
            />
          </Link>
          {badgeText ? (
            <span
              className={`absolute top-2 left-2 z-10 rounded-sm px-2 py-0.5 text-[11px] font-bold shadow-sm ${badgeClass}`}
            >
              {badgeText}
            </span>
          ) : null}
          <WishlistToggleButton
            productId={id}
            className="absolute right-1 top-1 z-[1] flex h-8 w-8 items-center justify-center rounded-full border border-black/15 bg-white text-wm-ink shadow-sm transition-colors hover:bg-wm-page"
            iconClassName="h-4 w-4"
          />
        </div>
        <div className="px-0 pt-2">
          <button
            type="button"
            disabled={!id || dummy || inCart}
            onClick={() => id && !dummy && addToCart(p, 1)}
            className={`w-full rounded-full border border-wm-ink bg-white py-2 text-xs font-semibold text-wm-ink transition-colors hover:bg-wm-page disabled:opacity-60 ${
              inCart ? "border-emerald-600 bg-emerald-50 text-emerald-800" : ""
            }`}
          >
            {dummy ? (
              "Options"
            ) : inCart ? (
              <span className="flex items-center justify-center gap-1">
                <FiCheck className="h-3.5 w-3.5" /> Added
              </span>
            ) : (
              "+ Add"
            )}
          </button>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
            {hasDiscount && originalPriceForDisplay != null ? (
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
            )}
          </div>
          <Link
            href={dummy ? "/products" : id ? `/product/${id}` : "#"}
            onMouseEnter={() => {
              if (!id || dummy) return;
              prefetchProductDetail(id);
            }}
            onFocus={() => {
              if (!id || dummy) return;
              prefetchProductDetail(id);
            }}
            className="mt-1 block"
          >
            <p
              className={PRODUCT_CARD_DETAILED_TITLE_CLASSNAME}
              title={headline}
            >
              {headline}
            </p>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <Link
        href={dummy ? "/products" : id ? `/product/${id}` : "#"}
        onMouseEnter={() => {
          if (!id || dummy) return;
          prefetchProductDetail(id);
        }}
        onFocus={() => {
          if (!id || dummy) return;
          prefetchProductDetail(id);
        }}
        className="block relative bg-[#f3f3f3] overflow-hidden"
      >
        <img
          src={img}
          alt=""
          className="wm-product-image"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src.includes(PRODUCT_IMAGE_FALLBACK)) return;
            target.onerror = null;
            target.src = PRODUCT_IMAGE_FALLBACK;
          }}
        />
        {badgeText ? (
          <span
            className={`absolute top-2 left-2 rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm ${badgeClass}`}
          >
            {badgeText}
          </span>
        ) : null}
      </Link>
      <div className="p-2.5">
        <Link
          href={dummy ? "/products" : id ? `/product/${id}` : "#"}
          onMouseEnter={() => {
            if (!id || dummy) return;
            prefetchProductDetail(id);
          }}
          onFocus={() => {
            if (!id || dummy) return;
            prefetchProductDetail(id);
          }}
        >
          <p className={PRODUCT_CARD_DETAILED_TITLE_CLASSNAME} title={headline}>
            {headline}
          </p>
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
          {hasDiscount && originalPriceForDisplay != null ? (
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
                className="text-xs text-wm-muted ml-1.5 mt-0.5"
              />
            </div>
          ) : (
            <div className="flex items-baseline flex-wrap">
              <PriceWithSmallRs
                dollars={dollars}
                cents={cents}
                toneClassName="text-primary"
              />
            </div>
          )}
        </div>
        <button
          type="button"
          disabled={!id || dummy || inCart}
          onClick={() => id && !dummy && addToCart(p, 1)}
          className={`mt-2 w-full text-xs font-semibold py-2 rounded-md ${
            inCart
              ? "bg-emerald-600 text-white"
              : "bg-primary text-white hover:bg-primary-600"
          } disabled:opacity-60 transition-colors`}
        >
          {dummy ? (
            "View on shop"
          ) : inCart ? (
            <span className="flex items-center justify-center gap-1">
              <FiCheck className="w-3 h-3" /> In cart
            </span>
          ) : (
            "Add to cart"
          )}
        </button>
      </div>
    </div>
  );
}

type ProductShelfRowProps = {
  sectionId: string;
  title: string;
  subtitle?: string;
  seeAllHref: string;
  products: Product[];
  badgeKind: BadgeKind;
  showWhenEmpty?: boolean;
  scrollArrows?: boolean;
};

export function ProductShelfRow({
  sectionId,
  title,
  subtitle,
  seeAllHref,
  products,
  badgeKind,
  showWhenEmpty = false,
  scrollArrows = true,
}: ProductShelfRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const userHasScrolledRef = useRef(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const edge = 6;
    setCanRight(scrollLeft + clientWidth < scrollWidth - edge);
    setCanLeft(userHasScrolledRef.current && scrollLeft > edge);
  }, []);

  const productsKey = products.map((p) => getProductId(p) || p.title).join("|");

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    userHasScrolledRef.current = false;
    el.scrollLeft = 0;
    updateScrollState();
  }, [productsKey, updateScrollState]);

  useEffect(() => {
    updateScrollState();
    const t = window.setTimeout(updateScrollState, 300);
    return () => window.clearTimeout(t);
  }, [productsKey, updateScrollState]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollLeft > 0) userHasScrolledRef.current = true;
      updateScrollState();
    };
    const ro = new ResizeObserver(() => updateScrollState());
    ro.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, [updateScrollState, productsKey]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const delta = Math.min(el.clientWidth * 0.8, 520);
    el.scrollBy({ left: dir * delta, behavior: "smooth" });
  };

  if (!products.length && !showWhenEmpty) return null;

  return (
    <section id={sectionId} className="scroll-mt-24">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          {subtitle ? (
            <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
          ) : null}
        </div>
        <Link
          href={seeAllHref}
          className="text-primary font-semibold text-sm flex items-center gap-1 shrink-0 hover:gap-2 transition-all"
        >
          See all <FiChevronRight className="w-4 h-4" />
        </Link>
      </div>
      {products.length === 0 ? (
        <p className="text-sm text-wm-muted py-6 rounded-lg border border-dashed border-wm-border bg-wm-page/50 px-4">
          No items to show yet — browse products to fill this row.
        </p>
      ) : (
        <div className="relative group/shelf">
          {scrollArrows && canLeft ? (
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollByDir(-1)}
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-wm-border bg-white/95 text-wm-ink shadow-md ring-2 ring-white hover:bg-white sm:opacity-90"
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>
          ) : null}
          <div
            ref={scrollRef}
            className={`flex min-w-0 gap-3 overflow-x-auto overflow-y-visible pb-2 no-scrollbar snap-x snap-mandatory scroll-smooth ${
              scrollArrows ? "px-0" : "-mx-1 px-1"
            }`}
          >
            {products.map((p) => (
              <ProductShelfCard
                key={getProductId(p) || p.title}
                p={p}
                badgeKind={badgeKind}
                variant="minimal"
              />
            ))}
          </div>
          {scrollArrows && canRight ? (
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollByDir(1)}
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-wm-border bg-white/95 text-wm-ink shadow-md ring-2 ring-white hover:bg-white"
            >
              <FiChevronRight className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
