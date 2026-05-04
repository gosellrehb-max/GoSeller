"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiUser, FiClipboard, FiShoppingBag, FiTruck, FiSettings, FiHelpCircle, FiMail } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { mailtoSupportHref } from "@/lib/supportContact";

export type HeaderAccountVariant = "inverse" | "light" | "minimal";

type AuthUser = NonNullable<ReturnType<typeof useAuth>["user"]>;

function displayName(user: AuthUser): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (user.name?.trim()) return user.name.trim();
  if (user.email) return user.email.split("@")[0] ?? user.email;
  return "there";
}

/** Icon rows — same for guest vs signed-in; hrefs differ by mode */
function AccountShortcutsNav({
  onNavigate,
  mode,
}: {
  onNavigate: () => void;
  mode: "guest" | "signedIn";
}) {
  const rows = [
    {
      label: "My Orders",
      icon: FiClipboard,
      guest: "/login/customer",
      signed: "/orders",
    },
  ].map(({ label, icon: Icon, guest, signed }) => ({
    label,
    Icon,
    href: mode === "guest" ? guest : signed,
  }));

  return (
    <nav
      className="border-b border-wm-border/90 py-1.5"
      aria-label="Account shortcuts"
    >
      {rows.map(({ label, Icon, href }) =>
        mode === "signedIn" || label === "My Orders" ? (
          <Link
            key={label}
            href={href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-wm-ink transition-colors hover:bg-gray-100"
          >
            <Icon
              className="h-4 w-4 shrink-0 text-wm-muted"
              strokeWidth={2}
              aria-hidden
            />
            {label}
          </Link>
        ) : (
          <span
            key={label}
            className="flex cursor-not-allowed items-center gap-3 px-4 py-2.5 text-sm font-medium text-wm-ink/40 opacity-40"
            aria-disabled="true"
          >
            <Icon
              className="h-4 w-4 shrink-0 text-wm-muted/40"
              strokeWidth={2}
              aria-hidden
            />
            {label}
          </span>
        ),
      )}
    </nav>
  );
}

function AccountFooterNav({
  onNavigate,
  mode,
  activeRole,
}: {
  onNavigate: () => void;
  mode: "guest" | "signedIn";
  activeRole?: "customer" | "seller" | "rider";
}) {
  let rows: { href: string; label: string; active: boolean }[] = [];

  if (mode === "guest") {
    rows = [{ href: "/login/customer", label: "Settings", active: true }];
  } else if (mode === "signedIn") {
    if (activeRole === "seller") {
      rows = [{ href: "/seller/settings", label: "Settings", active: true }];
    } else {
      rows = [{ href: "/profile", label: "Settings", active: true }];
    }
  }

  return (
    <nav className="py-2" aria-label="More">
      {rows.map(({ href, label, active }) =>
        active ? (
          <Link
            key={label}
            href={href}
            onClick={onNavigate}
            className="block rounded-lg px-4 py-2 text-[13px] text-wm-muted transition-colors hover:bg-gray-100 hover:text-wm-ink"
          >
            {label}
          </Link>
        ) : (
          <span
            key={label}
            className="block cursor-not-allowed px-4 py-2 text-[13px] text-wm-muted/40 opacity-40"
            aria-disabled="true"
          >
            {label}
          </span>
        ),
      )}
    </nav>
  );
}

function GuestDropdownContent({ onNavigate }: { onNavigate: () => void }) {
  return (
    <>
      <div className="border-b border-wm-border/90 px-4 pb-4 pt-4">
        <Link
          href="/login/customer"
          onClick={onNavigate}
          className="flex w-full items-center justify-center rounded-full bg-wm-ink py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-black"
        >
          Sign in
        </Link>
        <Link
          href="/register/customer"
          onClick={onNavigate}
          className="mt-3 block text-center text-sm font-medium text-wm-muted transition-colors hover:text-wm-ink"
        >
          Register
        </Link>
      </div>

      <AccountShortcutsNav onNavigate={onNavigate} mode="guest" />
      <nav className="border-b border-wm-border/90 py-1.5" aria-label="Help">
        <a
          href={mailtoSupportHref('GoSellr — Help & Support')}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-wm-ink transition-colors hover:bg-gray-100"
        >
          <FiHelpCircle className="h-4 w-4 shrink-0 text-wm-muted" strokeWidth={2} aria-hidden />
          Help / Support
        </a>
        <a
          href={mailtoSupportHref('GoSellr — Feedback')}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-wm-ink transition-colors hover:bg-gray-100"
        >
          <FiMail className="h-4 w-4 shrink-0 text-wm-muted" strokeWidth={2} aria-hidden />
          Feedback
        </a>
      </nav>
      <AccountFooterNav onNavigate={onNavigate} mode="guest" />
    </>
  );
}

type SwitchTarget = { key: "customer" | "seller" | "rider"; label: string };

function SignedInDropdownContent({
  user,
  onSignOut,
  onNavigate,
  switchTargets,
  onSwitchTo,
  activeRole,
}: {
  user: AuthUser;
  onSignOut: () => void;
  onNavigate: () => void;
  switchTargets: SwitchTarget[];
  onSwitchTo: (role: "customer" | "seller" | "rider") => void;
  activeRole: "customer" | "seller" | "rider";
}) {
  const initial =
    user.firstName?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || "?";
  const name = displayName(user);

  return (
    <>
      <div className="relative z-10 border-b border-wm-border/90 px-4 pb-4 pt-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600"
            aria-hidden
          >
            {initial}
          </div>
          <p className="min-w-0 flex-1 pt-0.5 text-sm leading-snug text-wm-ink">
            Welcome back, <span className="font-bold">{name}</span>
          </p>
        </div>
      </div>

      {switchTargets.length > 0 ? (
        <div className="border-b border-wm-border/90 px-4 py-3 flex flex-col gap-2">
          {switchTargets.map((t) => {
            const icon =
              t.key === 'seller'   ? <FiShoppingBag className="h-3.5 w-3.5 shrink-0" /> :
              t.key === 'rider'    ? <FiTruck       className="h-3.5 w-3.5 shrink-0" /> :
                                     <FiUser        className="h-3.5 w-3.5 shrink-0" />;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onSwitchTo(t.key)}
                className="inline-flex w-full items-center justify-center gap-2 rounded border border-black bg-transparent px-3 py-1.5 text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors"
              >
                {icon}
                {t.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Settings — gear icon, above sign out */}
      <Link
        href={activeRole === 'seller' ? '/seller/settings' : '/profile'}
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-wm-ink transition-colors hover:bg-gray-100"
      >
        <FiSettings className="h-4 w-4 shrink-0 text-wm-muted" strokeWidth={2} aria-hidden />
        Profile Settings
      </Link>

      <a
        href={mailtoSupportHref('GoSellr — Help & Support')}
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-wm-ink transition-colors hover:bg-gray-100"
      >
        <FiHelpCircle className="h-4 w-4 shrink-0 text-wm-muted" strokeWidth={2} aria-hidden />
        Help / Support
      </a>
      <a
        href={mailtoSupportHref('GoSellr — Feedback')}
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-wm-ink transition-colors hover:bg-gray-100"
      >
        <FiMail className="h-4 w-4 shrink-0 text-wm-muted" strokeWidth={2} aria-hidden />
        Feedback
      </a>

      <div className="border-t border-wm-border/90 px-4 py-2.5">
        <button
          type="button"
          onClick={onSignOut}
          className="w-full text-left text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </>
  );
}

function DropdownShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-[min(100vw-1.5rem,18.5rem)] max-h-[min(72vh,520px)] overflow-y-auto subtle-scrollbar rounded-2xl border border-wm-border bg-white shadow-[0_10px_40px_-4px_rgba(0,0,0,0.15)]"
      role="menu"
    >
      <div
        className="pointer-events-none absolute -top-1.5 left-1/2 z-20 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-wm-border bg-white shadow-sm"
        aria-hidden
      />
      <div className="relative z-10 rounded-2xl bg-white pt-1">{children}</div>
    </div>
  );
}

function useHoverMenuCapable() {
  const [hoverMenu, setHoverMenu] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setHoverMenu(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return hoverMenu;
}

/**
 * Guest: Sign in / Register + shortcuts (same panel everywhere).
 * Signed-in: Welcome back + Sign out + same shortcuts/footer.
 * Desktop (fine pointer + hover): open on hover; touch: tap to toggle.
 */
export default function HeaderAccountMenu({
  variant,
}: {
  variant: HeaderAccountVariant;
}) {
  const { user, isAuthenticated, logout, switchRole } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverMenu = useHoverMenuCapable();

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearCloseTimer();
    setOpen(false);
  }, [clearCloseTimer]);

  const openMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 140);
  }, [clearCloseTimer]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const handleSignOut = async () => {
    close();
    await logout();
  };

  const activeRole: "customer" | "seller" | "rider" =
    user?.role === "seller"
      ? "seller"
      : user?.role === "rider"
        ? "rider"
        : "customer";

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

  const ROLE_LABEL: Record<"customer" | "seller" | "rider", string> = {
    customer: "Switch to Buyer",
    seller: "Switch to Selling",
    rider: "Switch to Rider",
  };

  const handleSwitchTo = useCallback(
    async (target: "customer" | "seller" | "rider") => {
      close();
      const roles = Array.isArray(user?.roles) ? user.roles : [];
      const alreadyHasRole =
        target === "customer"
          ? true
          : target === "seller"
            ? user?.role === "seller" ||
              roles.includes("seller") ||
              Boolean((user as any)?.isSeller)
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
      if (typeof window !== "undefined") {
        localStorage.setItem("activeAccount", target);
      }
      router.push(ROLE_ONBOARDING[target]);
    },
    [close, router, switchRole, user],
  );

  const switchTargets: SwitchTarget[] = (
    ["customer", "seller", "rider"] as const
  )
    .filter((r) => r !== activeRole)
    .map((r) => ({ key: r, label: ROLE_LABEL[r] }));

  const panel =
    isAuthenticated && user ? (
      <DropdownShell>
        <SignedInDropdownContent
          user={user}
          onSignOut={handleSignOut}
          onNavigate={close}
          switchTargets={switchTargets}
          onSwitchTo={handleSwitchTo}
          activeRole={activeRole}
        />
      </DropdownShell>
    ) : (
      <DropdownShell>
        <GuestDropdownContent onNavigate={close} />
      </DropdownShell>
    );

  const triggerClassInverse =
    "flex items-center gap-2.5 rounded-lg px-2 sm:px-2.5 py-1.5 sm:py-2 text-white hover:bg-white/15 border border-transparent hover:border-white/30 transition-colors";
  const triggerClassLight =
    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-wm-ink hover:bg-gray-100 border border-transparent transition-colors";

  const hoverHandlers = hoverMenu
    ? { onMouseEnter: openMenu, onMouseLeave: scheduleClose }
    : {};

  const triggerClick = () => {
    if (!hoverMenu) setOpen((o) => !o);
  };

  if (variant === "minimal") {
    return (
      <div className="relative" ref={wrapRef} {...hoverHandlers}>
        <button
          type="button"
          onClick={triggerClick}
          className="hover:text-white/90 whitespace-nowrap max-w-[100px] sm:max-w-none truncate text-left text-sm font-semibold"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          {!isAuthenticated ? "Sign in" : "Account"}
        </button>
        {open ? (
          <div className="absolute right-0 top-full z-[70] pt-2">{panel}</div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapRef} {...hoverHandlers}>
      <button
        type="button"
        onClick={triggerClick}
        className={
          variant === "inverse" ? triggerClassInverse : triggerClassLight
        }
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        {variant === "inverse" ? (
          !isAuthenticated ? (
            <>
              <FiUser
                className="h-6 w-6 shrink-0 text-white"
                strokeWidth={2}
                aria-hidden
              />
              <span className="flex flex-col items-start justify-center gap-0.5 text-left leading-none">
                <span className="text-[10px] sm:text-[11px] font-normal text-white/90 tracking-tight">
                  Sign in
                </span>
                <span className="text-sm font-bold text-white sm:text-[15px]">
                  Account
                </span>
              </span>
            </>
          ) : (
            <span className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/20 text-sm font-bold text-white">
                {user?.firstName?.charAt(0) ||
                  user?.email?.charAt(0)?.toUpperCase() ||
                  "U"}
              </span>
              <span className="hidden max-w-[7rem] truncate text-sm font-semibold text-white xl:inline">
                Account
              </span>
            </span>
          )
        ) : !isAuthenticated ? (
          <>
            <FiUser
              className="h-5 w-5 shrink-0 text-wm-muted"
              strokeWidth={2}
              aria-hidden
            />
            <span className="flex flex-col items-start justify-center gap-0.5 text-left leading-none">
              <span className="text-[10px] sm:text-[11px] font-normal text-wm-muted tracking-tight">
                Sign in
              </span>
              <span className="text-sm font-bold text-wm-ink sm:text-[15px]">
                Account
              </span>
            </span>
          </>
        ) : (
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
              {user?.firstName?.charAt(0) ||
                user?.email?.charAt(0)?.toUpperCase() ||
                "U"}
            </span>
            <span className="max-w-[7rem] truncate text-sm font-medium text-gray-900 sm:max-w-[9rem]">
              {user?.firstName || (user ? displayName(user) : "Account")}
            </span>
          </span>
        )}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-[70] pt-2">{panel}</div>
      ) : null}
    </div>
  );
}
