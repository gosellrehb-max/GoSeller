/* auto-extracted — Marketplace site header (same as home) */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FiSearch,
  FiShoppingCart,
  FiMenu,
  FiX,
  FiChevronRight,
  FiChevronDown,
  FiMapPin,
  FiShoppingBag,
  FiUser,
  FiTruck,
  FiSettings,
  FiHelpCircle,
  FiMail,
} from "react-icons/fi";
import {
  CATEGORY_SUBMENU,
  CATEGORIES,
  CATEGORY_TO_SLUG_MAPPING,
} from "@/config/categories";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import HeaderAccountMenu from "@/components/layout/HeaderAccountMenu";
import { mailtoSupportHref } from "@/lib/supportContact";
import {
  getCurrentDeliveryLocation,
  getGeoErrorMessage,
  readDeliveryLocation,
  saveDeliveryLocation,
  saveDeliveryLocationToDb,
  type DeliveryLocation,
} from "@/utils/deliveryLocation";

/** Shown under the header search when expanded (focus / active) */
const TRENDING_SEARCH_QUERIES = [
  "wireless earbuds",
  "smartwatch deals",
  "coffee maker",
  "running shoes",
  "room decor",
  "skincare sets",
  "laptop bag",
  "gaming headset",
] as const;

function getCategorySubmenuLabels(slug: string, displayName: string): string[] {
  const configured = CATEGORY_SUBMENU[slug];
  if (configured?.length) return [...configured];
  return [
    `All ${displayName}`,
    `${displayName} deals`,
    "Trending",
    "New arrivals",
  ];
}

type NavCategory = { id: string; name: string; slug: string };

export default function MarketplaceSiteHeader({
  hideSubnav,
}: { hideSubnav?: boolean } = {}) {
  const router = useRouter();
  const { user, isAuthenticated, logout, switchRole } = useAuth();
  const { getCartItemCount } = useCart();
  const cartCount = getCartItemCount();
  const hideShoppingCatalog = user?.role === "seller";
  const activeRole: "customer" | "seller" | "rider" =
    user?.role === "seller"
      ? "seller"
      : user?.role === "rider"
        ? "rider"
        : "customer";
  const showSwitchButtons = isAuthenticated;

  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [subnavCatOpen, setSubnavCatOpen] = useState(false);
  const [subnavHoveredCategorySlug, setSubnavHoveredCategorySlug] = useState<
    string | null
  >(null);
  const [subnavMobileAccordionSlug, setSubnavMobileAccordionSlug] = useState<
    string | null
  >(null);
  const [deliveryLocation, setDeliveryLocation] =
    useState<DeliveryLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const deliveryRef = useRef<HTMLDivElement | null>(null);
  const subnavCatRef = useRef<HTMLDivElement | null>(null);
  const searchBarDesktopRef = useRef<HTMLFormElement | null>(null);
  const searchBarMobileRef = useRef<HTMLFormElement | null>(null);
  const trendingScrollDesktopRef = useRef<HTMLDivElement | null>(null);
  const trendingScrollMobileRef = useRef<HTMLDivElement | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const gosellerCategories = useMemo((): NavCategory[] => {
    return CATEGORIES.map((name, index) => ({
      id: String(index + 1),
      name,
      slug: CATEGORY_TO_SLUG_MAPPING[name],
    }));
  }, []);

  useEffect(() => {
    if (!subnavCatOpen) return;
    const close = (e: MouseEvent) => {
      if (!subnavCatRef.current?.contains(e.target as Node))
        setSubnavCatOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [subnavCatOpen]);

  useEffect(() => {
    if (!isSearchExpanded) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        searchBarDesktopRef.current?.contains(t) ||
        searchBarMobileRef.current?.contains(t)
      )
        return;
      setIsSearchExpanded(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [isSearchExpanded]);

  useEffect(() => {
    setDeliveryLocation(readDeliveryLocation());
  }, []);

  useEffect(() => {
    if (!showLocationPrompt) return;
    const close = (e: MouseEvent) => {
      if (!deliveryRef.current?.contains(e.target as Node))
        setShowLocationPrompt(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showLocationPrompt]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const applyTrendingSearch = (term: string) => {
    setSearchQuery(term);
    setIsSearchExpanded(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const onLogout = async () => {
    await logout();
  };

  const ROLE_DASHBOARD: Record<"customer" | "seller" | "rider", string> = {
    customer: "/",
    seller: "/seller",
    rider: "/rider",
  };

  const ROLE_ONBOARDING: Record<"customer" | "seller" | "rider", string> = {
    customer: "/register/customer",
    seller: "/seller/settings?onboarding=1",
    rider: "/profile?onboarding=1",
  };

  /** Attempt a seamless role switch; fall back to onboarding when the role isn't attached yet. */
  const handleSwitchRole = async (target: "customer" | "seller" | "rider") => {
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    const alreadyHasRole =
      target === "customer"
        ? true
        : target === "seller"
          ? user?.role === "seller" || roles.includes("seller")
          : user?.role === "rider" || roles.includes("rider");

    // Always call switchRole — for rider/seller it creates the profile in the backend if missing.
    const res = await switchRole(target);
    if (res.ok) {
      if (!alreadyHasRole && (target === "rider" || target === "seller")) {
        // Freshly granted role — send to onboarding to complete details
        if (typeof window !== "undefined") {
          localStorage.setItem("activeAccount", target);
        }
        router.push(ROLE_ONBOARDING[target]);
      } else {
        router.push(ROLE_DASHBOARD[target]);
      }
      return;
    }
    // switchRole failed — send to onboarding as fallback
    if (typeof window !== "undefined") {
      localStorage.setItem("activeAccount", target);
    }
    router.push(ROLE_ONBOARDING[target]);
  };

  const ROLE_LABEL: Record<"customer" | "seller" | "rider", string> = {
    customer: "Switch to Buyer",
    seller: "Switch to Selling",
    rider: "Switch to Rider",
  };

  const ROLE_ICON: Record<"customer" | "seller" | "rider", React.ReactNode> = {
    customer: <FiUser className="h-3.5 w-3.5 shrink-0" />,
    seller:   <FiShoppingBag className="h-3.5 w-3.5 shrink-0" />,
    rider:    <FiTruck className="h-3.5 w-3.5 shrink-0" />,
  };

  const switchTargets: Array<"customer" | "seller" | "rider"> = (
    ["customer", "seller", "rider"] as const
  ).filter((r) => r !== activeRole);

  const requestDeliveryLocation = async () => {
    try {
      setIsLocating(true);
      const loc = await getCurrentDeliveryLocation();
      saveDeliveryLocation(loc);
      setDeliveryLocation(loc);
      setShowLocationPrompt(true);
      if (isAuthenticated) {
        await saveDeliveryLocationToDb(user?.id, loc);
      }
    } catch (error: unknown) {
      toast.error(getGeoErrorMessage(error));
    } finally {
      setIsLocating(false);
    }
  };

  const onAddDeliveryAddress = () => {
    void requestDeliveryLocation();
  };

  const displayLocation =
    deliveryLocation?.address?.trim() || "Add Delivery Address";

  /** Sub-header row — light blue bar; underline grows from center */
  const subheaderLinkBase =
    "group relative inline-flex shrink-0 items-center px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors";
  const subheaderUnderline =
    "pointer-events-none absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-primary transition-[width] duration-300 ease-out group-hover:w-full group-focus-visible:w-full";
  const subheaderCategoriesUnderline =
    "pointer-events-none absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-primary transition-[width] duration-300 ease-out group-hover/subnav:w-full group-focus-within/subnav:w-full";
  const subheaderNavLinkClass = `${subheaderLinkBase} text-wm-ink hover:text-primary`;
  /** New Arrivals / Featured / Discounts / Deals — pill on light bar */
  const subheaderPillNavClass =
    "inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-white px-3 py-1.5 text-sm font-medium leading-none text-wm-ink shadow-none transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-[#E9F1FE]";
  const subheaderCatLinkClass =
    "block px-4 py-2.5 text-sm text-wm-ink hover:bg-primary-50 hover:text-primary transition-colors";
  const subheaderMegaLeftRowClass = (active: boolean) =>
    `flex w-full items-center border-l-[3px] py-2.5 pl-3 pr-3 text-left text-sm font-medium transition-colors ${
      active
        ? "border-primary bg-primary-100/80 text-wm-ink"
        : "border-transparent text-wm-ink hover:bg-primary-50/60"
    }`;
  const subheaderMegaFlyoutLinkClass =
    "block rounded-md px-2 py-2 text-sm text-wm-ink hover:bg-white/90 hover:text-primary transition-colors";

  const firstCategorySlug = gosellerCategories[0]?.slug ?? "";
  const resolvedFlyoutSlug =
    subnavHoveredCategorySlug != null &&
    gosellerCategories.some((c) => c.slug === subnavHoveredCategorySlug)
      ? subnavHoveredCategorySlug
      : firstCategorySlug;
  const activeFlyoutCategory =
    gosellerCategories.find((c) => c.slug === resolvedFlyoutSlug) ??
    gosellerCategories[0];

  return (
    <>
      {/* Walmart-style header: promo strip + logo/search/actions + department bar */}
      <header className="sticky top-0 inset-x-0 z-50 w-full min-w-0 bg-primary shadow-[0_8px_28px_-8px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] overflow-visible [margin-inline:0]">
        {/* Top strip: brand blue + white pill search + circular blue search button */}
        <div className="relative z-50 w-full min-w-0 bg-primary text-white overflow-visible">
          <div className="max-w-[1440px] mx-auto px-2.5 py-2 sm:px-3 sm:py-2.5 lg:h-[78px] lg:min-h-[78px] lg:max-h-[78px] lg:px-3 lg:py-3.5 overflow-visible">
            {/* Desktop: logo + delivery | centered search | My Orders, cart, account */}
            <div className="hidden lg:flex items-center gap-3 min-h-12">
              <div className="flex items-center gap-2.5 shrink-0 min-w-0">
                <Link href="/" className="flex items-center shrink-0">
                  <img
                    src="/images/Logo (2).png"
                    alt="GoSellr"
                    className="h-8 xl:h-9 w-auto max-w-[124px] object-contain object-left drop-shadow-sm"
                  />
                </Link>
                {!hideShoppingCatalog ? (
                  <div className="relative" ref={deliveryRef}>
                    <button
                      type="button"
                      onClick={() => onAddDeliveryAddress()}
                      className="inline-flex h-12 max-w-[285px] items-center gap-2 rounded-full border border-[#001E60] bg-[#001E60] px-3 text-left text-xs font-semibold text-white hover:bg-[#002874] transition-colors"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#001E60]">
                        <FiMapPin className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] leading-none text-white/80">
                          Pickup or delivery?
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-semibold">
                          {isLocating
                            ? "Detecting your location..."
                            : displayLocation}
                        </span>
                      </span>
                      <FiChevronDown
                        className="h-4 w-4 shrink-0 text-white/90"
                        aria-hidden
                      />
                    </button>
                    {showLocationPrompt ? (
                      <div className="absolute left-3 top-full z-[120] mt-2 w-[min(92vw,300px)] rounded-xl border border-[#0c2d7a] bg-[#0b2f85] px-3 py-2 text-white shadow-lg">
                        <span
                          className="pointer-events-none absolute -top-2 left-8 h-0 w-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-[#0b2f85]"
                          aria-hidden
                        />
                        <div className="flex items-center gap-2">
                          <FiMapPin
                            className="h-4 w-4 shrink-0 text-white"
                            aria-hidden
                          />
                          <p className="text-sm font-semibold">
                            Is this the right location?
                          </p>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-[#0b2f85] hover:bg-slate-100"
                            onClick={() => setShowLocationPrompt(false)}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-white/40 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/10"
                            onClick={() => {
                              setShowLocationPrompt(false);
                              void requestDeliveryLocation();
                            }}
                          >
                            Change Location
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex-1 flex justify-center min-w-0 px-3 overflow-visible">
                <form
                  onSubmit={onSearch}
                  className="relative z-[100] w-full max-w-[720px] overflow-visible"
                  ref={searchBarDesktopRef}
                >
                  <div
                    className={`bg-white transition-[border-radius,box-shadow] duration-200 ease-out ${
                      isSearchExpanded
                        ? "rounded-xl border border-wm-border shadow-wm-md"
                        : "rounded-full border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                    }`}
                  >
                    <div className="flex items-center gap-1 pl-5 pr-1.5 py-0 min-h-12">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchExpanded(true)}
                        placeholder="Search everything at GoSellr online and in store"
                        className="flex-1 min-w-0 bg-transparent border-0 py-1.5 pl-0 pr-2 text-sm xl:text-[15px] text-wm-ink placeholder:text-primary/55 placeholder:font-normal outline-none"
                        aria-expanded={isSearchExpanded}
                        aria-controls="header-search-trending-desktop"
                        id="header-search-input-desktop"
                      />
                      <button
                        type="submit"
                        className={`flex h-9 w-9 shrink-0 items-center justify-center bg-[#001E60] hover:bg-[#002874] text-white transition-[border-radius] duration-200 ${
                          isSearchExpanded ? "rounded-lg" : "rounded-full"
                        }`}
                        aria-label="Search"
                      >
                        <FiSearch className="h-[21px] w-[21px]" strokeWidth={2.1} />
                      </button>
                    </div>
                  </div>
                  {isSearchExpanded ? (
                    <div
                      id="header-search-trending-desktop"
                      className="absolute left-0 right-0 top-full z-[100] pt-1.5"
                      role="region"
                      aria-label="Trending searches"
                    >
                      <div className="rounded-xl border border-wm-border bg-white px-4 pt-3 pb-3.5 shadow-wm-md">
                        <p className="text-sm font-bold text-wm-ink mb-2.5">
                          Trending
                        </p>
                        <div className="flex items-center gap-2">
                          <div
                            ref={trendingScrollDesktopRef}
                            className="flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth py-0.5 no-scrollbar"
                          >
                            {TRENDING_SEARCH_QUERIES.map((term) => (
                              <button
                                key={term}
                                type="button"
                                className="shrink-0 rounded-full border border-wm-border bg-white px-3 py-1.5 text-left text-xs xl:text-sm font-medium text-wm-ink transition-colors hover:border-primary hover:text-primary"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => applyTrendingSearch(term)}
                              >
                                {term}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-wm-border bg-white text-wm-ink shadow-sm hover:bg-wm-page"
                            aria-label="Scroll trending searches"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() =>
                              trendingScrollDesktopRef.current?.scrollBy({
                                left: 140,
                                behavior: "smooth",
                              })
                            }
                          >
                            <FiChevronRight className="h-5 w-5" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </form>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  href={
                    !isAuthenticated
                      ? "/login/customer"
                      : hideShoppingCatalog
                        ? "/seller"
                        : "/orders"
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-white hover:bg-white/10 transition-colors"
                  aria-label={
                    hideShoppingCatalog
                      ? "Dashboard"
                      : "Favourites and My Orders"
                  }
                >
                  <FiShoppingBag
                    className="h-5 w-5 shrink-0 opacity-95"
                    strokeWidth={2}
                    aria-hidden
                  />
                  {hideShoppingCatalog ? (
                    <span className="text-xs font-bold whitespace-nowrap">
                      Dashboard
                    </span>
                  ) : (
                    <span className="flex flex-col items-start justify-center gap-0.5 leading-none text-left whitespace-nowrap">
                      <span className="text-[9px] sm:text-[10px] font-normal text-white/90 tracking-tight">
                        Wish List
                      </span>
                      <span className="text-xs font-bold sm:text-[13px]">
                        My Orders
                      </span>
                    </span>
                  )}
                </Link>

                <Link
                  href="/cart"
                  className="relative p-2.5 rounded-full text-white hover:bg-white/10"
                  aria-label="Cart"
                >
                  <FiShoppingCart className="h-7 w-7" />
                  <span className="absolute top-0.5 right-0.5 min-w-[1.125rem] h-4 px-1 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                </Link>

                <div className="pl-1">
                  <HeaderAccountMenu variant="inverse" />
                </div>
              </div>
            </div>

            {/* Mobile / tablet: top row + full-width search */}
            <div className="lg:hidden flex flex-col gap-1 overflow-visible">
              <div className="flex items-center gap-2 min-w-0">
                <Link href="/" className="flex items-center shrink-0">
                  <img
                    src="/images/Logo (2).png"
                    alt="GoSellr"
                    className="h-7 w-auto max-w-[116px] object-contain object-left"
                  />
                </Link>
                <div className="ml-auto flex items-center gap-0.5 shrink-0">
                  <Link
                    href={isAuthenticated ? (hideShoppingCatalog ? "/seller/orders" : "/orders") : "/login/customer"}
                    className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-white hover:bg-white/10 transition-colors"
                    aria-label="My Orders"
                  >
                    <FiShoppingBag className="h-5 w-5 shrink-0" strokeWidth={2} />
                    <span className="flex flex-col items-start leading-none text-left">
                      <span className="text-[9px] font-normal text-white/80">Wish List</span>
                      <span className="text-[11px] font-bold">My Orders</span>
                    </span>
                  </Link>
                  <Link
                    href="/cart"
                    className="relative p-2 rounded-full text-white hover:bg-white/10"
                    aria-label="Cart"
                  >
                    <FiShoppingCart className="w-6 h-6" />
                    <span className="absolute top-0.5 right-0.5 min-w-[1.125rem] h-4 px-1 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  </Link>
                  <button
                    type="button"
                    className="p-2 rounded-lg text-white hover:bg-white/10"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Open menu"
                    aria-expanded={isMenuOpen}
                    aria-controls="mobile-header-menu"
                  >
                    <FiMenu className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form
                onSubmit={onSearch}
                className="relative z-[100] w-full min-w-0 overflow-visible"
                ref={searchBarMobileRef}
              >
                <div
                  className={`bg-white transition-[border-radius,box-shadow] duration-200 ease-out ${
                    isSearchExpanded
                      ? "rounded-xl border border-wm-border shadow-wm-md"
                      : "rounded-full border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                  }`}
                >
                  <div className="flex items-center gap-1 pl-3 pr-1 py-0 min-h-[40px]">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchExpanded(true)}
                      placeholder="Search GoSellr…"
                      className="flex-1 min-w-0 bg-transparent border-0 py-1.5 text-sm text-wm-ink placeholder:text-primary/55 outline-none"
                      aria-expanded={isSearchExpanded}
                      aria-controls="header-search-trending-mobile"
                      id="header-search-input-mobile"
                    />
                    <button
                      type="submit"
                      className={`flex h-7 w-7 shrink-0 items-center justify-center bg-[#001E60] hover:bg-[#002874] text-white transition-[border-radius] duration-200 ${
                        isSearchExpanded ? "rounded-md" : "rounded-full"
                      }`}
                      aria-label="Search"
                    >
                      <FiSearch className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
                {isSearchExpanded ? (
                  <div
                    id="header-search-trending-mobile"
                    className="absolute left-0 right-0 top-full z-[100] pt-1.5"
                    role="region"
                    aria-label="Trending searches"
                  >
                    <div className="rounded-xl border border-wm-border bg-white px-3 pt-3 pb-3 shadow-wm-md">
                      <p className="text-sm font-bold text-wm-ink mb-2">
                        Trending
                      </p>
                      <div className="flex items-center gap-2">
                        <div
                          ref={trendingScrollMobileRef}
                          className="flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth py-0.5 no-scrollbar"
                        >
                          {TRENDING_SEARCH_QUERIES.map((term) => (
                            <button
                              key={term}
                              type="button"
                              className="shrink-0 rounded-full border border-wm-border bg-white px-3 py-1.5 text-left text-xs font-medium text-wm-ink transition-colors hover:border-primary hover:text-primary"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyTrendingSearch(term)}
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-wm-border bg-white text-wm-ink shadow-sm hover:bg-wm-page"
                          aria-label="Scroll trending searches"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() =>
                            trendingScrollMobileRef.current?.scrollBy({
                              left: 120,
                              behavior: "smooth",
                            })
                          }
                        >
                          <FiChevronRight className="h-5 w-5" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </form>
              {!hideShoppingCatalog ? (
                <button
                  type="button"
                  onClick={() => onAddDeliveryAddress()}
                  className="inline-flex h-9 w-full items-center gap-2 rounded-full border border-[#001E60] bg-[#001E60] px-3 text-left text-xs font-semibold text-white hover:bg-[#002874]"
                  aria-label="Add delivery address"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#001E60]">
                    <FiMapPin className="h-3 w-3" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 flex items-center gap-1.5 truncate">
                    <span className="text-[10px] text-white/80 shrink-0">Pickup or delivery?</span>
                    <span className="truncate text-xs font-semibold">
                      {isLocating ? "Detecting…" : displayLocation}
                    </span>
                  </span>
                  <FiChevronDown className="h-3.5 w-3.5 shrink-0 text-white/90" aria-hidden />
                </button>
              ) : null}
            </div>
            {isMenuOpen ? (
              <div
                id="mobile-header-menu"
                className="absolute inset-x-0 top-full z-[110] lg:hidden"
              >
                <div className="mx-auto max-w-[1440px] px-2 sm:px-2.5 lg:px-3">
                  <div className="mt-2 rounded-xl border border-wm-border bg-white px-2 pt-2 pb-4 shadow-wm-md">
                    <div className="space-y-2.5 px-2">
                      <div className="mb-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsMenuOpen(false)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-wm-border text-wm-ink transition-colors hover:bg-wm-page hover:text-primary"
                          aria-label="Close menu"
                        >
                          <FiX className="h-5 w-5" />
                        </button>
                      </div>
                      {isAuthenticated
                        ? switchTargets.map((target) => (
                            <button
                              key={target}
                              type="button"
                              className="inline-flex w-full items-center justify-center gap-2 rounded border border-black bg-transparent px-3 py-1.5 text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors"
                              onClick={async () => {
                                setIsMenuOpen(false);
                                await handleSwitchRole(target);
                              }}
                            >
                              {ROLE_ICON[target]}
                              {ROLE_LABEL[target]}
                            </button>
                          ))
                        : null}
                      {isAuthenticated ? (
                        <>
                          <Link
                            href={hideShoppingCatalog ? "/seller/settings" : "/profile"}
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-wm-ink transition-colors hover:bg-gray-100"
                          >
                            <FiSettings className="h-4 w-4 shrink-0 text-wm-muted" strokeWidth={2} />
                            Profile Settings
                          </Link>
                          <a
                            href={mailtoSupportHref("GoSellr — Help & Support")}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-wm-ink transition-colors hover:bg-gray-100"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <FiHelpCircle className="h-4 w-4 shrink-0 text-wm-muted" strokeWidth={2} aria-hidden />
                            Help / Support
                          </a>
                          <a
                            href={mailtoSupportHref("GoSellr — Feedback")}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-wm-ink transition-colors hover:bg-gray-100"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <FiMail className="h-4 w-4 shrink-0 text-wm-muted" strokeWidth={2} aria-hidden />
                            Feedback
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              void onLogout();
                              setIsMenuOpen(false);
                            }}
                            className="block w-full text-left text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors"
                          >
                            Sign out
                          </button>
                        </>
                      ) : (
                        <Link
                          href="/login/customer"
                          className="block w-full text-left text-primary font-semibold"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Sign in
                        </Link>
                      )}
                      {!isAuthenticated ? (
                        <Link
                          href="/register/customer"
                          className="block w-full text-left font-medium text-wm-ink"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Create account
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div
          className={`relative z-40 w-full min-w-0 overflow-visible border-t border-[#d7e4fb] border-b border-b-[#d7e4fb] bg-[#E9F1FE] ${hideSubnav ? "hidden" : ""}`}
        >
          <div className="max-w-[1440px] mx-auto h-[48px] min-h-[48px] max-h-[48px] px-6 py-0 flex w-full min-w-0 items-center gap-1 sm:gap-2 text-[13px] overflow-visible">
            <div className="flex w-full min-w-0 items-center gap-1 sm:gap-2">
              <div className="shrink-0 flex items-center gap-2 sm:gap-3 overflow-visible">
                {hideShoppingCatalog ? (
                  <Link
                    href="/seller"
                    className={`${subheaderNavLinkClass} gap-1.5 font-semibold py-1.5`}
                  >
                    <FiMenu
                      className="w-4 h-4 text-primary shrink-0"
                      aria-hidden
                    />
                    <span className="relative inline-block">
                      Seller hub
                      <span className={subheaderUnderline} aria-hidden />
                    </span>
                  </Link>
                ) : (
                  <div
                    className="relative shrink-0 overflow-visible"
                    ref={subnavCatRef}
                  >
                    {/* md+: hover / focus-within underline + flyout (must sit outside overflow-x scroll parent) */}
                    <div className="hidden md:block group/subnav">
                      <button
                        type="button"
                        className="flex items-center gap-1 shrink-0 px-2 py-1.5 rounded font-semibold text-wm-ink border border-transparent transition-colors select-none hover:text-primary"
                        aria-haspopup="menu"
                        aria-expanded="false"
                      >
                        <FiMenu
                          className="w-4 h-4 text-primary shrink-0"
                          aria-hidden
                        />
                        <span className="relative inline-block">
                          All Categories
                          <span
                            className={subheaderCategoriesUnderline}
                            aria-hidden
                          />
                        </span>
                        <FiChevronDown
                          className="w-3.5 h-3.5 text-wm-muted shrink-0 transition-transform group-hover/subnav:rotate-180 group-focus-within/subnav:rotate-180"
                          aria-hidden
                        />
                      </button>
                      <div
                        className="absolute left-0 top-full z-[80] pt-1.5 opacity-0 invisible pointer-events-none transition-[opacity,visibility] duration-150 group-hover/subnav:opacity-100 group-hover/subnav:visible group-hover/subnav:pointer-events-auto group-focus-within/subnav:opacity-100 group-focus-within/subnav:visible group-focus-within/subnav:pointer-events-auto"
                        role="menu"
                        aria-label="All categories"
                      >
                        <div
                          className="flex w-max max-w-[min(100vw-1.5rem,720px)] overflow-hidden rounded-lg border border-wm-border bg-white shadow-wm-md max-h-[min(70vh,480px)]"
                          onMouseLeave={() =>
                            setSubnavHoveredCategorySlug(null)
                          }
                        >
                          {gosellerCategories.length === 0 ? (
                            <Link
                              href="/products"
                              className={subheaderCatLinkClass}
                            >
                              Browse all products
                            </Link>
                          ) : (
                            <>
                              <div className="w-[min(44vw,220px)] shrink-0 overflow-y-auto border-r border-wm-border py-2 subtle-scrollbar">
                                <ul className="flex flex-col">
                                  {gosellerCategories.map((category) => {
                                    const active =
                                      category.slug === resolvedFlyoutSlug;
                                    return (
                                      <li key={category.id}>
                                        <Link
                                          href={`/category/${category.slug}`}
                                          className={subheaderMegaLeftRowClass(
                                            active,
                                          )}
                                          onMouseEnter={() =>
                                            setSubnavHoveredCategorySlug(
                                              category.slug,
                                            )
                                          }
                                        >
                                          {category.name}
                                        </Link>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                              <div className="min-w-[200px] max-w-[280px] flex-1 overflow-y-auto bg-primary-50/50 py-3 px-4 subtle-scrollbar">
                                {activeFlyoutCategory ? (
                                  <>
                                    <p className="text-base font-bold text-wm-ink mb-3 border-b border-primary/15 pb-2">
                                      {activeFlyoutCategory.name}
                                    </p>
                                    <ul className="flex flex-col gap-0.5">
                                      {getCategorySubmenuLabels(
                                        activeFlyoutCategory.slug,
                                        activeFlyoutCategory.name,
                                      ).map((label) => (
                                        <li
                                          key={`${activeFlyoutCategory.slug}-${label}`}
                                        >
                                          <Link
                                            href={`/category/${activeFlyoutCategory.slug}`}
                                            className={
                                              subheaderMegaFlyoutLinkClass
                                            }
                                          >
                                            {label}
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  </>
                                ) : null}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Small screens: tap to open */}
                    <div className="md:hidden">
                      <button
                        type="button"
                        onClick={() => {
                          setSubnavCatOpen((o) => {
                            const next = !o;
                            if (!next) setSubnavMobileAccordionSlug(null);
                            return next;
                          });
                        }}
                        className={`flex items-center gap-1 shrink-0 px-2 py-1.5 rounded font-semibold text-wm-ink border transition-colors ${
                          subnavCatOpen
                            ? "bg-white border-primary/20"
                            : "border-transparent hover:text-primary"
                        }`}
                        aria-expanded={subnavCatOpen}
                        aria-haspopup="true"
                      >
                        <FiMenu
                          className="w-4 h-4 text-primary shrink-0"
                          aria-hidden
                        />
                        <span className="relative inline-block">
                          All Categories
                          <span
                            className={`pointer-events-none absolute left-1/2 bottom-0 h-[2px] -translate-x-1/2 rounded-full bg-primary transition-[width] duration-300 ease-out ${
                              subnavCatOpen ? "w-full" : "w-0"
                            }`}
                            aria-hidden
                          />
                        </span>
                        <FiChevronDown
                          className={`w-3.5 h-3.5 text-wm-muted shrink-0 transition-transform ${subnavCatOpen ? "rotate-180" : ""}`}
                          aria-hidden
                        />
                      </button>
                      {subnavCatOpen ? (
                        <div className="absolute left-0 right-0 top-full z-[80] mt-1 min-w-[min(100vw-1.5rem,360px)] max-h-[min(70vh,420px)] overflow-y-auto rounded-lg border border-wm-border bg-white shadow-wm-md py-2 subtle-scrollbar">
                          {gosellerCategories.length === 0 ? (
                            <Link
                              href="/products"
                              className={subheaderCatLinkClass}
                              onClick={() => setSubnavCatOpen(false)}
                            >
                              Browse all products
                            </Link>
                          ) : (
                            <ul className="flex flex-col">
                              {gosellerCategories.map((category) => {
                                const open =
                                  subnavMobileAccordionSlug === category.slug;
                                return (
                                  <li
                                    key={category.id}
                                    className="border-b border-wm-border/80 last:border-0"
                                  >
                                    <div className="flex items-stretch">
                                      <Link
                                        href={`/category/${category.slug}`}
                                        className="flex-1 px-4 py-3 text-sm font-semibold text-wm-ink hover:bg-primary-50"
                                        onClick={() => setSubnavCatOpen(false)}
                                      >
                                        {category.name}
                                      </Link>
                                      <button
                                        type="button"
                                        className="shrink-0 px-3 text-wm-muted hover:bg-primary-50 hover:text-primary"
                                        aria-expanded={open}
                                        aria-label={
                                          open
                                            ? "Collapse subcategories"
                                            : "Show subcategories"
                                        }
                                        onClick={() =>
                                          setSubnavMobileAccordionSlug((s) =>
                                            s === category.slug
                                              ? null
                                              : category.slug,
                                          )
                                        }
                                      >
                                        <FiChevronDown
                                          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
                                          aria-hidden
                                        />
                                      </button>
                                    </div>
                                    {open ? (
                                      <ul className="border-t border-wm-border bg-primary-50/40 px-2 py-2">
                                        {getCategorySubmenuLabels(
                                          category.slug,
                                          category.name,
                                        ).map((label) => (
                                          <li key={label}>
                                            <Link
                                              href={`/category/${category.slug}`}
                                              className="block rounded-md px-3 py-2 text-sm text-wm-ink hover:bg-white hover:text-primary"
                                              onClick={() =>
                                                setSubnavCatOpen(false)
                                              }
                                            >
                                              {label}
                                            </Link>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : null}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                <span
                  className="h-4 w-px bg-primary/15 shrink-0 mx-0.5 hidden sm:block"
                  aria-hidden
                />
                {hideShoppingCatalog ? (
                  <Link
                    href="/seller"
                    className={subheaderPillNavClass}
                  >
                    New Arrivals
                  </Link>
                ) : (
                  <a href="#new-arrivals" className={subheaderPillNavClass}>
                    New Arrivals
                  </a>
                )}
                {hideShoppingCatalog ? (
                  <Link
                    href="/seller"
                    className={subheaderPillNavClass}
                  >
                    Featured
                  </Link>
                ) : (
                  <a href="#featured" className={subheaderPillNavClass}>
                    Featured
                  </a>
                )}
                {hideShoppingCatalog ? (
                  <Link
                    href="/seller"
                    className={subheaderPillNavClass}
                  >
                    Discounts %
                  </Link>
                ) : (
                  <a href="#discounts" className={subheaderPillNavClass}>
                    Discounts %
                  </a>
                )}
                {hideShoppingCatalog ? (
                  <Link
                    href="/seller"
                    className={subheaderPillNavClass}
                  >
                    Deals
                  </Link>
                ) : (
                  <a href="#trending" className={subheaderPillNavClass}>
                    Deals
                  </a>
                )}
              </div>
              {showSwitchButtons ? (
                <div className="hidden md:flex shrink-0 items-center gap-2 border-l border-primary/15 pl-3">
                  {switchTargets.map((target) => (
                    <button
                      key={target}
                      type="button"
                      onClick={() => handleSwitchRole(target)}
                      className="inline-flex items-center gap-1.5 rounded border border-black bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors"
                    >
                      {ROLE_ICON[target]}
                      {ROLE_LABEL[target]}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
