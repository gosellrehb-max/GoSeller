'use client';

import React, { useEffect, useMemo, useState } from 'react';
import SellerDashboardShell from '@/features/dashboard/components/SellerDashboardShell';
import { useQuery } from '@tanstack/react-query';
import { getSellerCustomers } from '@/features/dashboard/api/orders';
import { dashboardQueryKeys } from '@/features/dashboard/queries/queryKeys';
import type { SellerStoreCustomer } from '@/services/api';
import { formatPkr } from '@/utils/orderDisplay';
import toast from 'react-hot-toast';

function formatAddress(a: SellerStoreCustomer['lastShippingAddress']): string {
  if (!a?.address) return '—';
  const { street, city, state, zipCode, country } = a.address;
  const parts = [street, city, state, zipCode, country].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

function SellerCustomersPanel() {
  const [query, setQuery] = useState('');
  const {
    data: customers = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: dashboardQueryKeys.seller.customers,
    queryFn: getSellerCustomers,
  });

  useEffect(() => {
    if (!error) return;
    console.error(error);
    toast.error('Could not load customers.');
  }, [error]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      return name.includes(q) || (c.email || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q);
    });
  }, [customers, query]);

  const totalOrders = useMemo(() => customers.reduce((s, c) => s + c.orderCount, 0), [customers]);
  const totalSpent = useMemo(() => customers.reduce((s, c) => s + c.totalSpent, 0), [customers]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-600 mt-1">People who bought your products. Totals reflect your line items only.</p>
        </div>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, phone…" className="w-full sm:w-72 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="text-2xl font-bold text-primary">{customers.length}</div><div className="text-sm text-gray-500">Unique buyers</div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="text-2xl font-bold text-gray-900">{totalOrders}</div><div className="text-sm text-gray-500">Orders with your items</div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="text-2xl font-bold text-gray-900">{formatPkr(totalSpent)}</div><div className="text-sm text-gray-500">Your revenue from them</div></div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">{customers.length === 0 ? 'No customers yet. When buyers place orders for your products, they will appear here.' : 'No matches for your search.'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Delivery (last order)</th><th className="px-4 py-3 text-right">Orders</th><th className="px-4 py-3 text-right">Spent (your items)</th><th className="px-4 py-3">Last order</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr key={c.customerId} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3"><div className="font-medium text-gray-900">{[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}</div></td>
                    <td className="px-4 py-3"><div className="text-gray-900">{c.email || '—'}</div><div className="text-gray-500">{c.phone || '—'}</div></td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs"><div className="truncate" title={formatAddress(c.lastShippingAddress)}>{formatAddress(c.lastShippingAddress)}</div></td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.orderCount}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{formatPkr(c.totalSpent)}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SellerCustomersView() {
  return (
    <SellerDashboardShell>
      <SellerCustomersPanel />
    </SellerDashboardShell>
  );
}

