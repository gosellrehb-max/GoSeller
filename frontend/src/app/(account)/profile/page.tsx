import { Suspense } from 'react';
import AccountProfilePage from '@/features/account/profile/components/AccountProfilePage';

export default function AccountProfileRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <AccountProfilePage />
    </Suspense>
  );
}
