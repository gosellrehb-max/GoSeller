'use client';

import React from 'react';
import Link from 'next/link';

type AuthAccountShellProps = {
  children: React.ReactNode;
  maxWidthClass?: string;
  contentMaxWidthClass?: string;
  aside?: React.ReactNode;
  hideAside?: boolean;
  layout?: 'card' | 'fullPage';
  className?: string;
};

export function AuthAccountShell({
  children,
  maxWidthClass = 'max-w-md',
  contentMaxWidthClass = 'max-w-md',
  aside,
  hideAside = false,
  layout = 'card',
  className = '',
}: AuthAccountShellProps) {
  const showAside = Boolean(aside) && !hideAside;

  /* ---------- fullPage layout (login / register pages) ---------- */
  if (layout === 'fullPage') {
    if (!showAside) {
      return (
        <div
          className={`min-h-[100dvh] min-h-screen w-full bg-gray-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto subtle-scrollbar ${className}`}
        >
          <div
            className={`w-full ${contentMaxWidthClass} bg-white rounded-2xl border border-gray-200 shadow-[0_2px_24px_0_rgba(0,0,0,0.07)] overflow-hidden`}
          >
            {/* top accent line */}
            <div className="h-1 w-full bg-gradient-to-r from-primary via-blue-500 to-primary" />
            <div className="px-7 py-9 sm:px-10 sm:py-10">
              {children}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`min-h-[100dvh] min-h-screen w-full flex flex-col md:flex-row bg-white md:bg-wm-page ${className}`}
      >
        <div className="flex w-full flex-1 flex-col md:w-1/2 md:max-w-[50%] lg:w-[48%] lg:max-w-[48%] min-h-[100dvh] bg-white md:border-r border-wm-border overflow-y-auto subtle-scrollbar">
          <div className="flex flex-1 flex-col justify-center w-full max-w-2xl px-6 py-10 sm:px-10 sm:py-12 md:px-14 md:py-14 lg:pl-16 lg:pr-12 xl:pl-20 xl:pr-16">
            {children}
          </div>
        </div>
        <div className="relative hidden min-h-[100dvh] min-w-0 flex-1 overflow-hidden border-l border-wm-border md:block">
          {aside}
        </div>
      </div>
    );
  }

  /* ---------- card layout ---------- */
  return (
    <div
      className={`min-h-[100dvh] min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 box-border overflow-auto ${className}`}
    >
      <div
        className={`w-full ${maxWidthClass} bg-white rounded-2xl border border-gray-200 shadow-[0_2px_24px_0_rgba(0,0,0,0.07)] overflow-hidden flex flex-col md:flex-row`}
      >
        <div className="flex-1 flex flex-col p-7 sm:p-9 overflow-y-auto min-h-0 subtle-scrollbar">
          {children}
        </div>
        {showAside ? (
          <div className="hidden md:flex md:w-[42%] lg:w-[45%] bg-wm-bar border-l border-wm-border p-8 lg:p-10 items-center justify-center shrink-0">
            {aside}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Header ---------- */
type AuthAccountHeaderProps = {
  homeHref?: string;
  roleBadge?: string;
  title: string;
  subtitle?: string;
  /** @deprecated — close button removed; prop kept for backwards compatibility */
  showClose?: boolean;
};

export function AuthAccountHeader({
  homeHref = '/',
  roleBadge,
  title,
  subtitle,
}: AuthAccountHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center mb-7">
      <Link href={homeHref} className="inline-flex mb-5">
        <img src="/images/Logo (2).png" alt="GoSellr" className="h-10 w-auto object-contain" />
      </Link>
      {roleBadge ? (
        <span className="inline-block text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary bg-primary/8 px-3 py-1 rounded-full mb-3">
          {roleBadge}
        </span>
      ) : null}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
      {subtitle ? (
        <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-snug">{subtitle}</p>
      ) : null}
    </div>
  );
}

/* ---------- Portal links ---------- */
type AuthPortalLinksProps = {
  current: 'customer' | 'seller' | 'rider';
  className?: string;
};

export function AuthPortalLinks({ current, className = '' }: AuthPortalLinksProps) {
  const links: { href: string; label: string; key: typeof current }[] = [
    { href: '/login/customer', label: 'Customer', key: 'customer' },
    { href: '/login/seller', label: 'Seller', key: 'seller' },
    { href: '/login/rider', label: 'Rider', key: 'rider' },
  ];
  return (
    <p className={`text-center mt-6 text-xs text-wm-muted ${className}`}>
      Wrong portal?{' '}
      {links
        .filter((l) => l.key !== current)
        .map((l, i) => (
          <React.Fragment key={l.key}>
            {i > 0 ? ' · ' : null}
            <Link href={l.href} className="text-wm-link font-medium hover:text-wm-linkHover hover:underline">
              {l.label}
            </Link>
          </React.Fragment>
        ))}
    </p>
  );
}

/* ---------- Legal footer ---------- */
export function AuthLegalFooter() {
  return (
    <footer className="mt-8 pt-5 border-t border-gray-100">
      <p className="text-[11px] text-gray-400 text-center leading-relaxed">
        By continuing, you agree to our{' '}
        <Link href="/terms" className="text-primary hover:underline">
          Terms of Use
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </footer>
  );
}
