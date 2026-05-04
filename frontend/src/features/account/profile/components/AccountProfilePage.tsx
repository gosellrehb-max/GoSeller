'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import DashboardSimpleHeader from '@/components/layout/DashboardSimpleHeader';
import { useAuth, authUserIsRider } from '@/contexts/AuthContext';
import RiderProfilePanel from '@/features/account/profile/components/RiderProfilePanel';
import CustomerProfilePanel from '@/features/account/profile/components/CustomerProfilePanel';
import ChangePasswordPanel from '@/features/account/profile/components/ChangePasswordPanel';

export default function AccountProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams?.get('onboarding') === '1';
  const isRider = authUserIsRider(user);
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || '';

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardSimpleHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
        {isRider && isOnboarding && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-4">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-800">Rider account activated!</p>
              <p className="mt-0.5 text-sm text-green-700">
                Complete the fields below — phone, address, and ID number are required before you can accept deliveries. You can update these anytime from your profile.
              </p>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold text-gray-900">{isRider ? 'Rider profile' : 'Your account'}</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          {isRider
            ? 'Update your contact details, ID card, and vehicle info.'
            : 'Profile settings for your shopper account. Seller accounts use the seller portal.'}
        </p>

        {isRider ? (
          <RiderProfilePanel userName={displayName} userEmail={user.email} />
        ) : (
          <>
            <CustomerProfilePanel user={user} />
            <ChangePasswordPanel />
          </>
        )}

        {!isRider ? (
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
            >
              ← Back to home
            </Link>
          </div>
        ) : null}

      </main>
    </div>
  );
}
