'use client';

import SellerDashboardShell from '@/features/dashboard/components/SellerDashboardShell';
import OrdersView from '@/features/dashboard/components/OrdersView';

export default function SellerOrdersView() {
  return (
    <SellerDashboardShell>
      <OrdersView />
    </SellerDashboardShell>
  );
}

