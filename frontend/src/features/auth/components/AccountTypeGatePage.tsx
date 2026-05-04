'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag, Store, Bike, Globe, Package, Truck, ShieldCheck } from 'lucide-react';
import { authPrimaryButtonClass, authSecondaryLinkClass } from '@/features/auth/components/authFieldClasses';

export type AccountGateMode = 'sign-in' | 'sign-up';

type Role = 'buyer' | 'seller' | 'rider';

const NEXT_PATH: Record<AccountGateMode, Record<Role, string>> = {
  'sign-in': {
    buyer: '/login/customer',
    seller: '/login/seller',
    rider: '/login/rider',
  },
  'sign-up': {
    buyer: '/register/customer',
    seller: '/register/customer?info=seller',
    rider: '/register/rider',
  },
};

const OPTIONS: {
  id: Role;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'buyer',
    title: 'Buyer',
    description: 'Shop the marketplace, track orders, save addresses, and checkout with confidence.',
    Icon: ShoppingBag,
  },
  {
    id: 'seller',
    title: 'Seller',
    description: 'Open your store, list products, manage orders, and grow sales on GoSellr.',
    Icon: Store,
  },
  {
    id: 'rider',
    title: 'Rider',
    description: 'Accept deliveries, update order status, and earn on a schedule that works for you.',
    Icon: Bike,
  },
];

function RadioCard({
  selected,
  onSelect,
  title,
  description,
  Icon,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group w-full flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-wm-border bg-white hover:border-gray-300 hover:bg-wm-bar/50'
      }`}
      aria-pressed={selected}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected ? 'border-primary bg-primary' : 'border-gray-300 bg-white group-hover:border-gray-400'
        }`}
        aria-hidden
      >
        {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-wm-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-snug text-wm-muted">{description}</p>
      </div>
      <Icon
        className={`h-10 w-10 shrink-0 transition-colors ${selected ? 'text-primary' : 'text-gray-300 group-hover:text-primary/60'}`}
        aria-hidden
      />
    </button>
  );
}

export default function AccountTypeGatePage({ mode }: { mode: AccountGateMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<Role>('buyer');

  const heading =
    mode === 'sign-in' ? 'Which account would you like to sign in to?' : 'Which account would you like to create?';

  const onContinue = () => {
    const path = NEXT_PATH[mode][role];
    const redirect = searchParams?.get('redirect');
    const suffix = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
    router.push(`${path}${suffix}`);
  };

  const altMode = mode === 'sign-in' ? 'sign-up' : 'sign-in';
  const altHref = altMode === 'sign-in' ? '/login/customer' : '/register/customer';
  const altLabel = mode === 'sign-in' ? 'Create account' : 'Sign in';
  const prompt =
    mode === 'sign-in' ? "Don't have an account?" : 'Already have an account?';

  return (
    <div className="min-h-[100dvh] min-h-screen flex flex-col bg-white">
      <header className="shrink-0 border-b border-wm-border bg-white">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <img src="/images/Logo (2).png" alt="GoSellr" className="h-8 w-auto object-contain sm:h-9" />
          </Link>
          <div className="flex items-center gap-2 text-sm text-wm-muted">
            <Globe className="h-4 w-4 shrink-0" aria-hidden />
            <select
              className="cursor-pointer rounded-md border border-wm-border bg-white py-1.5 pl-2 pr-8 text-wm-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              aria-label="Language"
              defaultValue="en"
            >
              <option value="en">English</option>
              <option value="ur">Urdu</option>
            </select>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-400 px-8 py-10 sm:min-h-[280px] md:min-h-0 md:w-1/2 md:px-12 md:py-16 lg:px-16 lg:py-20">
          <div className="relative z-[1] mx-auto max-w-lg md:mx-0">
            <h1 className="text-center text-xl font-bold leading-tight text-white sm:text-2xl md:text-left md:text-3xl lg:leading-[1.2]">
              Shop and sell with{' '}
              <span className="text-white/95 underline decoration-white/40 decoration-2 underline-offset-4">
                buyer protection and trusted delivery
              </span>
            </h1>
            <p className="mt-3 text-center text-xs text-white/85 sm:text-sm md:text-left">
              One marketplace for buyers, sellers, and riders — built for your region.
            </p>
          </div>
          <div className="relative z-[1] mt-8 flex items-end justify-center gap-6 text-white/90 md:mt-12 md:justify-start">
            <div className="flex flex-col items-center gap-1 md:items-start">
              <Package className="h-9 w-9 sm:h-10 sm:w-10" strokeWidth={1.5} />
              <span className="text-xs font-medium text-white/80">Orders</span>
            </div>
            <div className="flex flex-col items-center gap-1 md:items-start">
              <Truck className="h-9 w-9 sm:h-10 sm:w-10" strokeWidth={1.5} />
              <span className="text-xs font-medium text-white/80">Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1 md:items-start">
              <ShieldCheck className="h-9 w-9 sm:h-10 sm:w-10" strokeWidth={1.5} />
              <span className="text-xs font-medium text-white/80">Trust</span>
            </div>
          </div>
          <div
            className="pointer-events-none absolute -right-20 -bottom-24 h-64 w-64 rounded-full bg-white/10 blur-2xl"
            aria-hidden
          />
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 md:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <h2 className="text-lg font-bold tracking-tight text-wm-ink sm:text-xl">{heading}</h2>
            <p className="mt-1.5 text-xs sm:text-sm text-wm-muted leading-snug">
              {mode === 'sign-in'
                ? 'Select how you use GoSellr. You will enter your email and password on the next screen.'
                : 'Select the account type that fits you. You will complete registration on the next steps.'}
            </p>

            <div className="mt-8 flex flex-col gap-3" role="radiogroup" aria-label="Account type">
              {OPTIONS.map(({ id, title, description, Icon }) => (
                <RadioCard
                  key={id}
                  selected={role === id}
                  onSelect={() => setRole(id)}
                  title={title}
                  description={description}
                  Icon={Icon}
                />
              ))}
            </div>

            <button type="button" onClick={onContinue} className={`${authPrimaryButtonClass} mt-8`}>
              Continue
            </button>

            <p className="mt-6 text-center text-xs sm:text-sm text-wm-muted">
              {prompt}{' '}
              <Link href={altHref} className={authSecondaryLinkClass}>
                {altLabel}
              </Link>
            </p>

            <footer className="mt-10 border-t border-wm-border pt-6">
              <p className="text-center text-[11px] leading-relaxed text-wm-muted">
                By continuing you agree to our{' '}
                <Link href="/terms" className="text-wm-link hover:underline">
                  Terms of Use
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-wm-link hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
