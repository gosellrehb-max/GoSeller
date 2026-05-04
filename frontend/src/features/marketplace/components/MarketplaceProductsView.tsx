'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORIES, CATEGORY_TO_SLUG_MAPPING } from '@/config/categories';
import StorefrontFooter from '@/components/layout/StorefrontFooter';
import { useCmsCategoryImages } from '@/hooks/useCmsPromoBanners';
import { mailtoSupportHref } from '@/lib/supportContact';

const FALLBACK_IMAGE = '/images/GoSellrIcon.png';

export default function MarketplaceProductsView() {
  const { user } = useAuth();
  const cmsCategoryImages = useCmsCategoryImages();

  if (user?.role === 'seller') {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900">Seller account</h1>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              The customer product catalog is not available while you are signed in as a seller. Use your dashboard to manage listings and your store.
            </p>
            <Link href="/seller" className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-600 w-full">
              Go to seller dashboard
            </Link>
            <Link href="/" className="mt-4 block text-sm text-primary font-medium hover:underline">
              Back to home
            </Link>
          </div>
        </main>
        <StorefrontFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-1 w-full pb-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 sm:mb-10 mt-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Shop by category</h1>
          </div>
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 lg:gap-8">
            {CATEGORIES.map((category) => {
              const slug = CATEGORY_TO_SLUG_MAPPING[category] || category.toLowerCase();
              const imgUrl = cmsCategoryImages[slug] || FALLBACK_IMAGE;
              return (
                <Link key={category} href={`/category/${slug}`}>
                  <div className="flex flex-col items-center group cursor-pointer h-full">
                    <div className="w-full aspect-square bg-[#f0f2f5] rounded-3xl flex items-center justify-center p-6 transition-transform duration-300 ease-out group-hover:scale-105 group-hover:shadow-sm">
                      <img src={imgUrl} alt={category} className="w-full h-full object-contain mix-blend-multiply select-none" loading="lazy" />
                    </div>
                    <span className="mt-4 text-[13px] sm:text-[15px] font-semibold text-gray-800 group-hover:text-black hover:underline transition-colors text-center w-full truncate px-1">{category}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <section
        className="w-full border-t border-b border-primary-900/30 bg-primary-50/80 py-10 sm:py-12 px-4 mt-auto"
        aria-labelledby="feedback-cta-heading"
      >
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center gap-4">
          <p id="feedback-cta-heading" className="text-base sm:text-lg font-medium text-wm-ink">
            We&apos;d love to hear what you think!
          </p>
          <a
            href={mailtoSupportHref('GoSellr — Feedback')}
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

