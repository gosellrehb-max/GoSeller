"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FiStar, FiChevronRight, FiCheck } from "react-icons/fi";
import { LuArrowUpRight } from "react-icons/lu";
import { type Product } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { marketplaceQueryKeys } from "@/features/marketplace/queries/queryKeys";
import { getProducts } from "@/features/marketplace/api/products";
import { useHomeShelves } from "@/features/marketplace/hooks/useMarketplaceQueries";
import { resolveProductPrimaryImage } from "@/utils/productImageUrl";
import StorefrontFooter from "@/components/layout/StorefrontFooter";
import MarketplacePromoCarousel from "@/features/marketplace/components/home/MarketplacePromoCarousel";
import MarketplaceEventCards from "@/features/marketplace/components/home/MarketplaceEventCards";
import { ProductShelfRow } from "@/features/marketplace/components/home/MarketplaceHomeShelves";
import { getRecentlyViewedProductIds } from "@/utils/recentlyViewedProducts";
import { FEATURED_DUMMY_DATA } from "@/config/featuredData";
import { DISCOUNTS_DUMMY_DATA } from "@/config/discountsData";
import { TRENDING_DUMMY_DATA } from "@/config/trendingData";
import { NEW_ARRIVALS_DUMMY_DATA } from "@/config/newArrivalsData";
import { mergeShelfProducts } from "@/utils/shelfMerge";
import GetItAllRightHereCarousel from "@/features/marketplace/components/home/GetItAllRightHereCarousel";
import FlashInsert from "@/features/marketplace/components/home/FlashInsert";
import {
  FLASH_INSERT_AFTER_GET_IT_ALL,
  FLASH_INSERT_AFTER_DISCOUNTS,
} from "@/config/flashInsertDefinitions";
import {
  useCmsPromoBanners,
  mergeFlashInsert,
  cmsToPromoEventBundle,
  buildCmsCategoryImageMap,
} from "@/hooks/useCmsPromoBanners";
import { CATEGORY_TO_SLUG_MAPPING } from "@/config/categories";
import { WishlistToggleButton } from "@/components/ui/WishlistToggleButton";
import { mailtoSupportHref } from "@/lib/supportContact";

export interface ShowcaseProduct {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  stock: number;
  images: string[];
  category: string;
  isBestSeller?: boolean;
}

export interface ShowcaseCategory {
  id: string;
  name: string;
  slug: string;
  bestSellers: ShowcaseProduct[];
}

type MarketplaceHomeViewProps = {
  showCategoriesDropdown: boolean;
  setShowCategoriesDropdown: (v: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  gosellerCategories: ShowcaseCategory[];
  getProductImage: (productName: string, category: string) => string;
  handleAddToCart: (product: ShowcaseProduct) => Promise<void>;
  isProductInCart: (id: string) => boolean;
  hideShoppingCatalog?: boolean;
  onAddDeliveryAddress?: () => void;
};

const TOP_PRODUCTS = [
  {
    name: "Classic runners",
    price: 89.99,
    rating: 4.7,
    img: "/images/GoSellrIcon.png",
  },
  {
    name: "Linen shirt",
    price: 42.5,
    rating: 4.5,
    img: "/images/GoSellrIcon.png",
  },
  {
    name: "Leather tote",
    price: 120,
    rating: 4.8,
    img: "/images/GoSellrIcon.png",
  },
];

const TOP_STORES = [
  { name: "Nova Retail", img: "/images/GoSellrIcon.png" },
  { name: "Metro Mart", img: "/images/GoSellrIcon.png" },
  { name: "City Bazaar", img: "/images/GoSellrIcon.png" },
];

export default function MarketplaceHomeView({
  showCategoriesDropdown,
  setShowCategoriesDropdown,
  dropdownRef,
  gosellerCategories,
  getProductImage,
  handleAddToCart,
  isProductInCart,
  hideShoppingCatalog = false,
}: MarketplaceHomeViewProps) {
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const recentParams = React.useMemo(
    () => ({ ids: recentIds.join(",") }),
    [recentIds],
  );

  // Single batched request for all four home shelves (was 4 separate requests before).
  const { data: shelves } = useHomeShelves(!hideShoppingCatalog);
  const featuredProducts   = shelves?.featured    ?? [];
  const discountProducts   = shelves?.discounts   ?? [];
  const trendingProducts   = shelves?.trending    ?? [];
  const newArrivalsProducts = shelves?.newArrivals ?? [];

  useEffect(() => {
    if (hideShoppingCatalog || typeof window === "undefined") {
      setRecentIds([]);
      return;
    }
    setRecentIds(getRecentlyViewedProductIds().slice(0, 10));
  }, [hideShoppingCatalog]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onUpdate = () =>
      setRecentIds(getRecentlyViewedProductIds().slice(0, 10));
    window.addEventListener("gosellr-recently-viewed-updated", onUpdate);
    return () =>
      window.removeEventListener("gosellr-recently-viewed-updated", onUpdate);
  }, []);

  const { data: recentlyViewedProducts = [] } = useQuery({
    queryKey: marketplaceQueryKeys.products.list(recentParams),
    enabled: !hideShoppingCatalog && recentIds.length > 0,
    queryFn: async () => {
      const res = await getProducts({ ids: recentIds });
      return (res?.products ?? []) as Product[];
    },
  });

  const mergedFeatured = React.useMemo(
    () => mergeShelfProducts(featuredProducts, FEATURED_DUMMY_DATA, 24),
    [featuredProducts],
  );
  const mergedDiscounts = React.useMemo(
    () => mergeShelfProducts(discountProducts, DISCOUNTS_DUMMY_DATA, 24),
    [discountProducts],
  );
  const mergedTrending = React.useMemo(
    () => mergeShelfProducts(trendingProducts, TRENDING_DUMMY_DATA, 24),
    [trendingProducts],
  );
  const mergedNewArrivals = React.useMemo(
    () => mergeShelfProducts(newArrivalsProducts, NEW_ARRIVALS_DUMMY_DATA, 24),
    [newArrivalsProducts],
  );

  const { data: cmsBanners = [] } = useCmsPromoBanners();

  const cmsCategoryImages = React.useMemo(
    () => buildCmsCategoryImageMap(cmsBanners),
    [cmsBanners],
  );

  const homeCategoryTiles = React.useMemo(
    () =>
      gosellerCategories.map((cat) => {
        const slug = CATEGORY_TO_SLUG_MAPPING[cat.name as keyof typeof CATEGORY_TO_SLUG_MAPPING]
          ?? cat.slug
          ?? cat.name.toLowerCase();
        const image =
          cmsCategoryImages[slug]
          || getProductImage(cat.name, cat.name);
        return {
          id: cat.id,
          label: cat.name,
          href: `/category/${cat.slug}`,
          image,
        };
      }),
    [gosellerCategories, getProductImage, cmsCategoryImages],
  );

  const flashAfterDiscounts = React.useMemo(() => {
    const cms = cmsBanners.find(
      (b) => b.type === "flash_banner" && b.slot === "flash_after_discounts" && b.isActive,
    );
    return cms ? mergeFlashInsert(FLASH_INSERT_AFTER_DISCOUNTS, cms) : FLASH_INSERT_AFTER_DISCOUNTS;
  }, [cmsBanners]);

  const flashAfterGetItAll = React.useMemo(() => {
    const cms = cmsBanners.find(
      (b) => b.type === "flash_banner" && b.slot === "flash_after_get_it_all" && b.isActive,
    );
    return cms ? mergeFlashInsert(FLASH_INSERT_AFTER_GET_IT_ALL, cms) : FLASH_INSERT_AFTER_GET_IT_ALL;
  }, [cmsBanners]);

  const cmsEventBundles = React.useMemo(
    () =>
      cmsBanners
        .filter((b) => b.type === "event_mosaic" && b.isActive)
        .map(cmsToPromoEventBundle)
        .filter(Boolean),
    [cmsBanners],
  );

  const navLinks = [
    "Frequent Questions",
    "Who we are?",
    "Partner Program",
    "Help & Support",
  ];
  const features = [
    {
      title: "Place an Order!",
      desc: "Place order through our website or mobile app",
      icon: "/images/order-food 1.png",
    },
    {
      title: "Track Progress",
      desc: "Track your order status with delivery time",
      icon: "/images/food 1.png",
    },
    {
      title: "Get your Order!",
      desc: "Receive your order at lightning fast speed!",
      icon: "/images/order 1.png",
    },
  ];
  const breakdown = [
    { label: "Corporate-Franchies", value: 100 },
    { label: "Master-Franchies", value: 500 },
    { label: "Sub-Franchies", value: 1500 },
  ];
  const totalbranches = [{ label: "Total Branches", value: 5000 }];
  const cityData = [
    { name: "Islamabad", corp: "80+", master: "30+", sub: "10+" },
    { name: "Pindi", corp: "80+", master: "30+", sub: "10+" },
    { name: "Lahore", corp: "80+", master: "30+", sub: "10+" },
    { name: "Faisalabad", corp: "80+", master: "30+", sub: "10+" },
    { name: "Karachi", corp: "80+", master: "30+", sub: "10+" },
  ];

  void recentlyViewedProducts;

  return (
    <div className="min-h-screen wm-page">
      <div className="max-w-[1440px] mx-auto">
        <div className="min-w-0">
          <section
            id="hero"
            className="scroll-mt-24 bg-white border-b border-wm-border"
          >
            <div className="w-full px-2 sm:px-3 lg:px-4 xl:px-5 pt-6 sm:pt-8 pb-6 sm:pb-8">
              <MarketplacePromoCarousel
                hideShoppingCatalog={hideShoppingCatalog}
              />
            </div>
          </section>

          <div className="w-full bg-white border-b border-wm-border">
            {!hideShoppingCatalog ? (
              <div className="px-3 sm:px-4 lg:px-6 xl:px-8 pt-4 sm:pt-6 pb-2">
                <ProductShelfRow
                  sectionId="new-arrivals"
                  title="New arrivals"
                  subtitle="Fresh drops added to the catalog"
                  seeAllHref="/products"
                  products={mergedNewArrivals}
                  badgeKind="new"
                />
              </div>
            ) : null}

            <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 pb-6 sm:pb-8 pt-2 max-w-[1440px] mx-auto">
              <MarketplaceEventCards
                hideShoppingCatalog={hideShoppingCatalog}
                cmsBundles={cmsEventBundles.length > 0 ? (cmsEventBundles as any) : undefined}
              />
            </div>

            <main className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-8 sm:py-10 space-y-10 sm:space-y-12">
              {hideShoppingCatalog ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-sm">
                  <p className="text-lg font-semibold text-slate-900">
                    Signed in as a seller
                  </p>
                  <p className="text-slate-600 text-sm mt-3 max-w-md mx-auto leading-relaxed">
                    The customer catalog and product showcases are hidden while
                    you use a seller account. Manage your store from the
                    dashboard.
                  </p>
                  <Link
                    href="/seller"
                    className="inline-flex mt-6 items-center justify-center rounded-xl bg-[#00966D] px-6 py-3 text-sm font-semibold text-white hover:bg-[#007d5b] transition-colors"
                  >
                    Go to seller dashboard
                  </Link>
                </section>
              ) : (
                <>
                  <ProductShelfRow
                    sectionId="featured"
                    title="Featured"
                    subtitle="Hand-picked listings from the catalog"
                    seeAllHref="/products"
                    products={mergedFeatured}
                    badgeKind="featured"
                  />
                  <ProductShelfRow
                    sectionId="discounts"
                    title="Discounts & savings"
                    subtitle="Rollbacks and deals on everyday essentials"
                    seeAllHref="/products"
                    products={mergedDiscounts}
                    badgeKind="discount"
                  />
                  <FlashInsert
                    definition={flashAfterDiscounts}
                    products={mergedDiscounts.slice(0, 12)}
                    hideShoppingCatalog={hideShoppingCatalog}
                  />
                  <ProductShelfRow
                    sectionId="trending"
                    title="Trending"
                    subtitle="What everyone is viewing right now"
                    seeAllHref="/products"
                    products={mergedTrending}
                    badgeKind="trending"
                  />

                  <GetItAllRightHereCarousel
                    tiles={homeCategoryTiles}
                    hideShoppingCatalog={hideShoppingCatalog}
                    viewAllHref="/products"
                  />
                  <FlashInsert
                    definition={flashAfterGetItAll}
                    products={mergedFeatured.slice(0, 12)}
                    hideShoppingCatalog={hideShoppingCatalog}
                  />

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-8">
                      Best Seller
                    </h2>
                    <div className="grid lg:grid-cols-2 gap-10">
                      {gosellerCategories.slice(0, 2).map((category) => (
                        <div key={category.id}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800">
                              {category.name}
                            </h3>
                            <Link
                              href={`/category/${category.slug}`}
                              className="text-sm text-[#00966D] font-semibold"
                            >
                              View all
                            </Link>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {category.bestSellers.slice(0, 4).map((product) => {
                              const pid = String(product._id ?? "");
                              const inCart = pid ? isProductInCart(pid) : false;
                              return (
                                <div
                                  key={product._id}
                                  className="wm-shelf-card"
                                >
                                  <div className="relative bg-[#f3f3f3] overflow-hidden">
                                    <img
                                      src={resolveProductPrimaryImage(product)}
                                      alt={product.name}
                                      className="wm-product-image"
                                    />
                                    <WishlistToggleButton
                                      productId={String(product._id ?? "")}
                                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow"
                                      iconClassName="w-4 h-4"
                                    />
                                  </div>
                                  <div className="p-2.5">
                                    <p className="text-[13px] font-semibold text-wm-ink line-clamp-2 min-h-[2.35rem] leading-snug">
                                      {product.name}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1 mb-2">
                                      {[...Array(5)].map((_, i) => (
                                        <FiStar
                                          key={i}
                                          className={`w-3 h-3 ${i < Math.floor(product.rating) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                                        />
                                      ))}
                                      <span className="text-xs text-slate-500">
                                        ({product.reviews})
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-bold text-wm-ink">
                                        ${product.price}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          !inCart && handleAddToCart(product)
                                        }
                                        disabled={inCart}
                                        className={`text-xs font-semibold px-3 py-1.5 rounded-md ${
                                          inCart
                                            ? "bg-emerald-600 text-white"
                                            : "bg-primary text-white hover:bg-primary-600"
                                        }`}
                                      >
                                        {inCart ? (
                                          <span className="flex items-center gap-1">
                                            <FiCheck className="w-3 h-3" /> In
                                            cart
                                          </span>
                                        ) : (
                                          "Add to Cart"
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="grid lg:grid-cols-2 gap-10">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-4">
                        Top rated products
                      </h2>
                      <div className="grid grid-cols-3 gap-3">
                        {TOP_PRODUCTS.map((p) => (
                          <div key={p.name} className="wm-shelf-card">
                            <div className="relative aspect-square bg-[#f3f3f3] overflow-hidden">
                              <img
                                src={p.img}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-2">
                              <p className="text-xs font-semibold text-wm-ink line-clamp-2">
                                {p.name}
                              </p>
                              <p className="text-sm font-bold text-primary">
                                ${p.price}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-4">
                        Top rated stores
                      </h2>
                      <div className="grid grid-cols-1 gap-3">
                        {TOP_STORES.map((s) => (
                          <div
                            key={s.name}
                            className="flex gap-3 bg-white rounded-xl border border-slate-100 p-3 shadow-sm"
                          >
                            <img
                              src={s.img}
                              alt=""
                              className="w-24 h-24 rounded-lg object-cover shrink-0"
                            />
                            <div className="flex flex-col justify-center">
                              <p className="font-bold text-slate-900">
                                {s.name}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Trusted seller · Fast dispatch
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </>
              )}
            </main>
          </div>

          <section className="w-full px-4 sm:px-8 py-12">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-7xl mx-auto">
              <div className="max-w-[1440px] mx-auto px-4 md:px-12">
                <div className="flex flex-col lg:flex-row justify-between items-center mb-12 gap-8">
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Know more about us!
                  </h2>
                  <div className="flex flex-wrap justify-center gap-3 text-sm font-medium text-gray-500">
                    {navLinks.map((link, i) => (
                      <span
                        key={link}
                        className={`px-6 py-2 rounded-full border transition-all ${
                          i === 0
                            ? "border-[#00a67e] text-gray-900 bg-white shadow-sm"
                            : "border-transparent hover:text-gray-900"
                        }`}
                      >
                        {link}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {features.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-100 rounded-[2.5rem] p-10 flex flex-col items-center text-center hover:scale-[1.02] transition-transform duration-300"
                    >
                      <h3 className="text-2xl font-semibold mb-8 text-gray-800">
                        {item.title}
                      </h3>
                      <div className="h-44 w-full flex items-center justify-center mb-8">
                        <img
                          src={item.icon}
                          alt=""
                          className="max-h-full w-auto object-contain drop-shadow-md"
                        />
                      </div>
                      <p className="text-gray-500 text-base leading-relaxed max-w-[240px]">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section
            className="w-full py-10 sm:py-12 px-4 sm:px-8"
            aria-labelledby="our-future-plans-heading"
          >
            <div className="max-w-6xl mx-auto">
              <div className="rounded-3xl border-2 border-slate-300/80 bg-[#ececec] p-4 sm:p-6 shadow-[12px_12px_0px_0px_rgba(15,23,42,0.08)]">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-wm ring-1 ring-black/[0.04]">
                  <h2
                    id="our-future-plans-heading"
                    className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-8"
                  >
                    Our Future Plans
                  </h2>

                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-[3] flex flex-row justify-around items-center bg-[#FFCC00] rounded-2xl py-8 px-4 shadow-[8px_10px_0px_0px_#E6B800]">
                      {breakdown.map((item, index) => (
                        <div
                          key={index}
                          className="flex flex-col items-center px-1"
                        >
                          <p className="text-2xl md:text-4xl font-bold text-gray-900">
                            {item.value.toLocaleString()}+
                          </p>
                          <p className="text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-tighter mt-1 text-center">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 flex flex-col justify-center items-center bg-[#009669] rounded-2xl py-8 px-6 shadow-[8px_10px_0px_0px_#057A57] min-w-[240px]">
                      {totalbranches.map((total, index) => (
                        <React.Fragment key={index}>
                          <p className="text-4xl md:text-6xl font-bold text-white">
                            {total.value.toLocaleString()}+
                          </p>
                          <p className="text-lg font-medium text-white mt-2 whitespace-nowrap">
                            {total.label}
                          </p>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-5 sm:p-6 shadow-[8px_8px_0px_0px_#B2D8D8]">
                      <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar">
                        {cityData.map((city, index) => (
                          <div
                            key={index}
                            className="min-w-[220px] bg-white border border-gray-200 rounded-xl p-5 hover:border-[#009669] transition-colors group cursor-pointer"
                          >
                            <div className="flex justify-between items-start mb-6">
                              <h3 className="text-[#009669] text-2xl font-bold">
                                {city.name}
                              </h3>
                              <LuArrowUpRight className="text-[#009669] text-xl group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500 font-medium">
                                  Corporate Franchaise
                                </span>
                                <span className="text-gray-800 font-bold">
                                  {city.corp}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 font-medium">
                                  Master
                                </span>
                                <span className="text-gray-800 font-bold">
                                  {city.master}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 font-medium text-[11px] uppercase tracking-tighter">
                                  Sub Franchies
                                </span>
                                <span className="text-gray-800 font-bold">
                                  {city.sub}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="w-full border-b border-primary-900/30 bg-primary-50/80 py-10 sm:py-12 px-4"
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

        </div>
      </div>
      <StorefrontFooter />
    </div>
  );
}
