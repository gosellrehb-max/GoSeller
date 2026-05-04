"use client";

import Link from "next/link";
import type { AccountNavId } from "./types";

export function AccountOrdersSidebar({
  activeNav,
  ordersHref,
  wishlistHref,
}: {
  activeNav: AccountNavId;
  ordersHref: string;
  wishlistHref: string;
}) {
  const baseItem =
    "relative block w-full border-l-4 border-transparent py-2.5 pl-3 pr-2 text-left text-sm transition-colors";
  const activeItem = "border-red-600 bg-red-50/60 font-semibold text-gray-900";
  const enabledItem = "text-slate-700 hover:bg-gray-50 hover:text-gray-900";
  const disabledItem = "cursor-not-allowed text-slate-400 opacity-55";
  const NavLink = ({
    navId,
    href,
    children,
    disabled,
  }: {
    navId: AccountNavId;
    href?: string;
    children: React.ReactNode;
    disabled?: boolean;
  }) => {
    const isActive = !disabled && activeNav === navId;
    if (disabled)
      return (
        <span className={`${baseItem} ${disabledItem}`} aria-disabled>
          {children}
        </span>
      );
    return (
      <Link
        href={href!}
        className={`${baseItem} ${isActive ? activeItem : enabledItem}`}
        aria-current={isActive ? "page" : undefined}
      >
        {children}
      </Link>
    );
  };

  return (
    <aside
      className="w-full shrink-0 rounded-lg border border-gray-200 bg-white lg:w-56 lg:min-w-[14rem] lg:sticky lg:top-0 lg:self-start"
      aria-label="Account"
    >
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">Account</h2>
      </div>
      <nav className="flex flex-col px-1 py-2">
        <NavLink navId="orders" href={ordersHref}>
          Orders
        </NavLink>
        <NavLink navId="wishlist" href={wishlistHref}>
          Wishlist
        </NavLink>
      </nav>
    </aside>
  );
}
