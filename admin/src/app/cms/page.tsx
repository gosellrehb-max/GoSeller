'use client';

import { useState } from 'react';
import AdminShell from '@/components/AdminShell';
import CmsCarouselManager from '@/features/cms/components/CmsCarouselManager';
import PromoBannersManager from '@/features/cms/components/PromoBannersManager';
import CategoryImagesManager from '@/features/cms/components/CategoryImagesManager';

const TABS = [
  { id: 'carousel',    label: 'Hero Carousel' },
  { id: 'promo',       label: 'Promo Banners & Events' },
  { id: 'categories',  label: 'Category Images' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function CmsPage() {
  const [tab, setTab] = useState<TabId>('carousel');

  return (
    <AdminShell>
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 sm:px-6">
        <nav className="-mb-px flex gap-1 sm:gap-6 overflow-x-auto no-scrollbar" aria-label="CMS tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="overflow-y-auto">
        {tab === 'carousel'   && <CmsCarouselManager />}
        {tab === 'promo'      && <PromoBannersManager />}
        {tab === 'categories' && <CategoryImagesManager />}
      </div>
    </AdminShell>
  );
}
