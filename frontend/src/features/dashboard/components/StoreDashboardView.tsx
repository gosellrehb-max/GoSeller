'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FiMapPin, FiImage, FiX, FiAlertCircle } from 'react-icons/fi';
import type { SellerProfile } from '@/services/api';
import { normalizeAreasFromProfile } from '@/config/areaOfDistribution';
import SellerDashboardShell from '@/features/dashboard/components/SellerDashboardShell';
import { getSellerIdFromSession } from '@/features/dashboard/utils/sellerSession';
import { getCurrentSellerProfile } from '@/features/dashboard/api/sellerSettings';
import { dashboardQueryKeys } from '@/features/dashboard/queries/queryKeys';
import { isSellerProfileCompleteForSelling } from '@/features/dashboard/utils/sellerProfileCompletion';

export default function StoreDashboardView() {
  const router = useRouter();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileReminder, setShowProfileReminder] = useState(true);
  const { data: sellerProfile = null } = useQuery<SellerProfile | null>({
    queryKey: dashboardQueryKeys.seller.storeProfile,
    queryFn: getCurrentSellerProfile,
    enabled: Boolean(sellerId),
  });

  const needsProfileCompletion = Boolean(sellerProfile && !isSellerProfileCompleteForSelling(sellerProfile));

  useEffect(() => {
    const id = getSellerIdFromSession();
    if (!id) {
      router.push('/seller/settings?onboarding=1');
      return;
    }
    setSellerId(id);
    setIsLoading(false);
  }, [router]);

  if (isLoading || !sellerId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SellerDashboardShell>
      <main className="mx-auto flex-1 max-w-7xl px-0 py-2 sm:py-4">
        {needsProfileCompletion && showProfileReminder ? (
          <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 sm:px-6 flex items-start sm:items-center gap-3">
            <FiAlertCircle className="w-5 h-5 text-amber-600 mt-0.5 sm:mt-0 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Please complete your seller profile to start selling smoothly.{' '}
              <Link href="/seller/settings?onboarding=1" className="font-semibold underline hover:text-amber-900 transition-colors">
                Complete Profile
              </Link>
            </p>
          </div>
        ) : null}

        <div className="relative mb-6 overflow-hidden rounded-lg shadow-md sm:mb-8" style={sellerProfile?.storeBannerUrl ? { backgroundImage: `linear-gradient(rgba(17,24,39,0.55), rgba(17,24,39,0.55)), url(${sellerProfile.storeBannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
          {!sellerProfile?.storeBannerUrl ? <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-gray-200" /> : null}
          <div className="relative p-4 sm:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className={`text-2xl font-bold sm:text-3xl ${sellerProfile?.storeBannerUrl ? 'text-white' : 'text-gray-900'}`}>Welcome back, {sellerProfile?.businessName || sellerProfile?.name || 'Seller'}!</h1>
                <p className={`mt-2 ${sellerProfile?.storeBannerUrl ? 'text-white/90' : 'text-gray-600'}`}>View the store information you submitted during registration.</p>
              </div>
              <div className="self-start md:self-auto"><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 sm:h-24 sm:w-24">{sellerProfile?.storeLogoUrl ? <img src={sellerProfile.storeLogoUrl} alt={`${sellerProfile.businessName || 'Store'} logo`} className="h-full w-full object-cover" /> : <span className="px-2 text-center text-xs text-gray-400">No image</span>}</div></div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 sm:mb-8">
          <div className="rounded-lg bg-white p-5 shadow-md sm:p-6"><p className="mb-1 text-sm text-gray-500">Seller Category</p><p className="text-2xl font-bold text-gray-900">{sellerProfile?.sellerCategory || 'Shopkeeper'}</p></div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-lg bg-white p-5 shadow-md sm:p-6"><h2 className="mb-4 text-xl font-bold text-gray-900">Store Details</h2><div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2"><div><p className="text-gray-500">Owner Name</p><p className="break-words font-semibold text-gray-900">{sellerProfile?.name || '-'}</p></div><div><p className="text-gray-500">Email</p><p className="break-words font-semibold text-gray-900">{sellerProfile?.email || '-'}</p></div><div><p className="text-gray-500">Phone</p><p className="break-words font-semibold text-gray-900">{sellerProfile?.phone || '-'}</p></div><div><p className="text-gray-500">Business & store category</p><p className="break-words font-semibold text-gray-900">{sellerProfile?.businessType || sellerProfile?.storeCategory || '-'}</p></div><div><p className="text-gray-500">Business License</p><p className="break-words font-semibold text-gray-900">{sellerProfile?.businessLicense || '-'}</p></div><div><p className="text-gray-500">Area of distribution</p><p className="break-words font-semibold text-gray-900">{normalizeAreasFromProfile(sellerProfile?.areaOfDistribution).join(', ') || '-'}</p></div><div><p className="text-gray-500">Authorized Territories</p><p className="break-words font-semibold text-gray-900">{sellerProfile?.authorizedTerritories || '-'}</p></div></div></div>
            <div className="rounded-lg bg-white p-5 shadow-md sm:p-6"><h2 className="mb-4 text-xl font-bold text-gray-900">Mailing address</h2><div className="space-y-3 text-sm"><div className="flex items-start gap-3"><FiMapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="break-words text-gray-700">{[sellerProfile?.city, sellerProfile?.state, sellerProfile?.zipCode, sellerProfile?.country].filter(Boolean).join(', ') || '-'}</p></div></div></div></div>
            <div className="rounded-lg bg-white p-5 shadow-md sm:p-6"><h2 className="mb-4 text-xl font-bold text-gray-900">Store Description</h2><p className="break-words leading-7 text-gray-700">{sellerProfile?.storeDescription || 'No store description added yet.'}</p></div>
          </div>
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-5 shadow-md sm:p-6"><h2 className="mb-4 text-xl font-bold text-gray-900">Store Assets</h2><div className="space-y-3 text-sm"><div className="flex flex-col gap-1 rounded-lg bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-center gap-2 text-gray-700"><FiImage className="h-4 w-4" /> Store Logo</span><span className="font-medium text-gray-900">{sellerProfile?.storeLogoUrl ? 'Uploaded' : 'Not uploaded'}</span></div><div className="flex flex-col gap-1 rounded-lg bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-center gap-2 text-gray-700"><FiImage className="h-4 w-4" /> Store Banner</span><span className="font-medium text-gray-900">{sellerProfile?.storeBannerUrl ? 'Uploaded' : 'Not uploaded'}</span></div></div></div>
            <div className="rounded-lg bg-white p-5 shadow-md sm:p-6"><h2 className="mb-4 text-xl font-bold text-gray-900">Capabilities</h2><div className="space-y-3 text-sm">{Object.entries(sellerProfile?.capabilities || {}).map(([key, value]) => <div key={key} className="flex flex-col gap-1 rounded-lg bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-gray-700">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</span><span className="break-all font-medium text-gray-900">{String(value)}</span></div>)}{!sellerProfile?.capabilities || Object.keys(sellerProfile.capabilities).length === 0 ? <p className="text-gray-500">No capability data available.</p> : null}</div></div>
          </div>
        </div>
      </main>
    </SellerDashboardShell>
  );
}

