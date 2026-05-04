import { Suspense } from 'react';
import SellerSettingsView from '@/features/dashboard/components/SellerSettingsView';

export default function SellerSettingsPage() {
  return (
    <Suspense>
      <SellerSettingsView />
    </Suspense>
  );
}
