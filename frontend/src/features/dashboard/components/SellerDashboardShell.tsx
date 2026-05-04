"use client";

import React, { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiLogOut,
  FiGrid,
  FiTag,
  FiFileText,
  FiUsers,
  FiBarChart,
  FiSettings,
  FiShield,
  FiUser,
  FiChevronDown,
  FiMenu,
  FiX,
  FiTruck,
  FiHelpCircle,
  FiMail,
} from "react-icons/fi";
import GoSellerLogo from "@/components/ui/GoSellerLogo";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSellerIdFromSession,
  hasAnyAuthToken,
} from "@/features/dashboard/utils/sellerSession";
import { mailtoSupportHref } from "@/lib/supportContact";

export const SELLER_NAV_ITEMS = [
  { href: "/seller", label: "Dashboard", icon: FiGrid },
  { href: "/seller/products", label: "Products", icon: FiTag },
  { href: "/seller/orders", label: "Orders", icon: FiFileText },
  { href: "/seller/customers", label: "Customers", icon: FiUsers },
  { href: "/seller/analytics", label: "Analytics", icon: FiBarChart },
  { href: "/seller/settings", label: "Profile Settings", icon: FiSettings },
] as const;

export default function SellerDashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    switchRole,
    logout,
  } = useAuth();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const accountMenuRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const hasSellerRole =
      user?.role === "seller" || user?.roles?.includes("seller");
    if (isAuthenticated && hasSellerRole && user?.id) {
      localStorage.setItem("activeAccount", "seller");
      // If the active JWT role is already seller, we're done immediately.
      if (user.role === "seller") {
        setSellerId(String(user.id));
        setIsLoading(false);
        return;
      }
      // Active role is something else (e.g. "customer" after auto-switch on marketplace).
      // Switch to seller so the seller JWT is issued before child components render.
      const activate = async () => {
        const res = await switchRole("seller");
        if (res.ok && user?.id) {
          setSellerId(String(user.id));
          setIsLoading(false);
        }
      };
      void activate();
      return;
    }
    if (hasAnyAuthToken()) {
      const id = getSellerIdFromSession();
      if (id) {
        setSellerId(id);
        setIsLoading(false);
        return;
      }
    }
    const activateSeller = async () => {
      const res = await switchRole("seller");
      if (res.ok && user?.id) {
        localStorage.setItem("activeAccount", "seller");
        setSellerId(String(user.id));
        setIsLoading(false);
        if (pathname === "/seller") {
          router.replace("/seller/settings?onboarding=1");
        }
        return;
      }
      router.replace("/seller/settings?onboarding=1");
    };
    void activateSeller();
  }, [authLoading, isAuthenticated, pathname, router, switchRole, user]);

  const handleSignOut = async () => {
    await logout();
    localStorage.removeItem("sellerId");
    router.push("/login/seller");
  };

  const handleSwitchTo = async (target: "customer" | "rider") => {
    if (switchingRole) return;
    setSwitchingRole(true);
    try {
      const ROLE_DASHBOARD: Record<"customer" | "rider", string> = {
        customer: "/",
        rider: "/rider",
      };
      const ROLE_ONBOARDING: Record<"customer" | "rider", string> = {
        customer: "/register/customer",
        rider: "/profile?onboarding=1",
      };
      const res = await switchRole(target);
      setIsAccountOpen(false);
      if (res.ok) {
        router.push(ROLE_DASHBOARD[target]);
        return;
      }
      localStorage.setItem("activeAccount", target);
      router.push(ROLE_ONBOARDING[target]);
    } finally {
      setSwitchingRole(false);
    }
  };

  useEffect(() => {
    if (!isAccountOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isAccountOpen]);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (!sellerId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access your seller dashboard
          </p>
          <Link
            href="/login/seller"
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const accountMenu = (
    <div className="absolute right-0 mt-2 w-52 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <div className="flex flex-col gap-2 mb-2">
        <button
          type="button"
          onClick={() => handleSwitchTo("customer")}
          disabled={switchingRole}
          className="flex w-full items-center justify-center gap-2 rounded border border-black bg-transparent px-3 py-1.5 text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiUser className="h-3.5 w-3.5" />
          <span>Switch to Buyer</span>
        </button>
        <button
          type="button"
          onClick={() => handleSwitchTo("rider")}
          disabled={switchingRole}
          className="flex w-full items-center justify-center gap-2 rounded border border-black bg-transparent px-3 py-1.5 text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiTruck className="h-3.5 w-3.5" />
          <span>Switch to Rider</span>
        </button>
      </div>
      <div className="my-1 border-t border-gray-100" />
      <Link
        href="/seller/settings"
        className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        onClick={() => setIsAccountOpen(false)}
      >
        <FiSettings className="h-4 w-4" />
        <span>Profile Settings</span>
      </Link>
      <a
        href={mailtoSupportHref("GoSellr — Help & Support")}
        className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        onClick={() => setIsAccountOpen(false)}
      >
        <FiHelpCircle className="h-4 w-4 shrink-0" aria-hidden />
        Help / Support
      </a>
      <a
        href={mailtoSupportHref("GoSellr — Feedback")}
        className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        onClick={() => setIsAccountOpen(false)}
      >
        <FiMail className="h-4 w-4 shrink-0" aria-hidden />
        Feedback
      </a>
      <div className="my-1 border-t border-gray-100" />
      <button
        type="button"
        onClick={handleSignOut}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
      >
        <FiLogOut className="h-4 w-4" />
        <span>Logout</span>
      </button>
    </div>
  );

  const navLinks = (
    <ul className="w-full space-y-1 px-3">
      {SELLER_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <li key={item.label}>
            <Link
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 h-16 border-b border-[#00318a] bg-primary">
        <div className="flex h-full w-full items-center justify-between gap-3 px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white hover:bg-white/30 lg:hidden"
              aria-label="Open seller navigation"
            >
              <FiMenu className="h-5 w-5" />
            </button>
            <Link href="/seller" className="inline-flex">
              <GoSellerLogo className="h-8 w-auto" />
            </Link>
          </div>
          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              onClick={() => setIsAccountOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white hover:bg-white/30"
              aria-label="Account menu"
            >
              <FiUser className="h-5 w-5" />
            </button>
            {isAccountOpen ? accountMenu : null}
          </div>
        </div>
      </header>

      {isMobileNavOpen ? (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          aria-hidden={!isMobileNavOpen}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Close seller navigation"
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(85vw,20rem)] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
              <Link
                href="/seller"
                className="inline-flex"
                onClick={() => setIsMobileNavOpen(false)}
              >
                <GoSellerLogo className="h-8 w-auto" />
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100"
                aria-label="Close seller navigation"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3">{navLinks}</nav>
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-[calc(100vh-4rem)] min-w-0">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
          <nav className="flex-1 overflow-y-auto py-3">{navLinks}</nav>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="min-h-[calc(100vh-4rem)] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
