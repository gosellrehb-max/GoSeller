'use client';

import React, { useEffect, useMemo, useState } from 'react';
import SellerDashboardShell from '@/features/dashboard/components/SellerDashboardShell';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { getSellerAnalytics } from '@/features/dashboard/api/orders';
import { dashboardQueryKeys } from '@/features/dashboard/queries/queryKeys';
import type { SellerAnalyticsPeriod, SellerStoreAnalytics } from '@/services/api';
import { formatPkr } from '@/utils/orderDisplay';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PERIOD_OPTIONS: { value: SellerAnalyticsPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily (14 days)' }, { value: 'weekly', label: 'Weekly (12 weeks)' }, { value: 'monthly', label: 'Monthly (12 months)' }, { value: 'yearly', label: 'Yearly (5 years)' }, { value: 'all', label: 'All time' },
];
const PERIOD_CHART_TITLE: Record<SellerAnalyticsPeriod, { revenue: string; orders: string }> = {
  daily: { revenue: 'Revenue by day', orders: 'Orders by day' }, weekly: { revenue: 'Revenue by week', orders: 'Orders by week' }, monthly: { revenue: 'Revenue by month', orders: 'Orders by month' }, yearly: { revenue: 'Revenue by year', orders: 'Orders by year' }, all: { revenue: 'Revenue by year (all time)', orders: 'Orders by year (all time)' },
};
function sortWeekKeys(points: { key: string; label: string; revenue: number; orders: number }[]): { label: string; revenue: number; orders: number }[] { const parse = (k: string) => { const [y, rest] = k.split('-W'); return { y: Number(y), w: Number(rest) }; }; return [...points].sort((a, b) => { const A = parse(a.key); const B = parse(b.key); if (A.y !== B.y) return A.y - B.y; return A.w - B.w; }).map((p) => ({ label: p.label, revenue: p.revenue, orders: p.orders })); }
function padChartSeries(period: SellerAnalyticsPeriod, points: SellerStoreAnalytics['chart']['points']): { label: string; revenue: number; orders: number }[] {
  const map = new Map(points.map((p) => [p.key, p]));
  if (period === 'daily') { const out = []; const now = new Date(); for (let i = 13; i >= 0; i--) { const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i)); const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`; const v = map.get(key); out.push({ label: `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()].slice(0, 3)}`, revenue: v?.revenue ?? 0, orders: v?.orders ?? 0 }); } return out; }
  if (period === 'monthly') { const out = []; const now = new Date(); for (let i = 11; i >= 0; i--) { const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)); const y = d.getUTCFullYear(); const m = d.getUTCMonth() + 1; const key = `${y}-${m}`; const v = map.get(key); out.push({ label: v?.label ?? `${MONTH_NAMES[m - 1]} ${String(y).slice(-2)}`, revenue: v?.revenue ?? 0, orders: v?.orders ?? 0 }); } return out; }
  if (period === 'yearly') { const y1 = new Date().getUTCFullYear(); const y0 = y1 - 4; const out = []; for (let y = y0; y <= y1; y++) { const v = map.get(String(y)); out.push({ label: String(y), revenue: v?.revenue ?? 0, orders: v?.orders ?? 0 }); } return out; }
  if (period === 'all') { if (points.length === 0) { const y = new Date().getUTCFullYear(); return [{ label: String(y), revenue: 0, orders: 0 }]; } const years = points.map((p) => parseInt(p.key, 10)).filter((n) => !Number.isNaN(n)); const minY = Math.min(...years); const maxY = Math.max(new Date().getUTCFullYear(), ...years); const out = []; for (let y = minY; y <= maxY; y++) { const v = map.get(String(y)); out.push({ label: String(y), revenue: v?.revenue ?? 0, orders: v?.orders ?? 0 }); } return out; }
  return sortWeekKeys(points);
}
function chartTooltipFormatter(value: number | string, name: string): [string, string] { if (name === 'revenue') return [formatPkr(Number(value)), 'Revenue']; if (name === 'orders' || name === 'Orders') return [String(value), 'Orders']; return [String(value), name]; }

function SellerAnalyticsPanel() {
  const [period, setPeriod] = useState<SellerAnalyticsPeriod>('monthly');
  const { data = null, isLoading: loading, error } = useQuery<SellerStoreAnalytics | null>({
    queryKey: dashboardQueryKeys.analytics.byPeriod(period),
    queryFn: async () => getSellerAnalytics({ period }),
  });
  useEffect(() => {
    if (!error) return;
    console.error(error);
    toast.error('Could not load analytics.');
  }, [error]);
  const chartSeries = useMemo(() => (data ? padChartSeries(data.period, data.chart.points) : []), [data]);
  const topBars = useMemo(() => (data?.topProducts?.length ? data.topProducts.map((p) => ({ name: p.title.length > 28 ? `${p.title.slice(0, 26)}…` : p.title, fullTitle: p.title, revenue: p.revenue, units: p.units, productId: p.productId })) : []), [data]);
  const chartCopy = data ? PERIOD_CHART_TITLE[data.period] : PERIOD_CHART_TITLE.monthly;
  const topProductsScope = data?.period === 'all' ? 'All time' : 'Matching the selected period';
  const xAxisAngle = data?.period === 'daily' ? -40 : 0;
  const xAxisHeight = data?.period === 'daily' ? 56 : 28;
  const chartMargins = { top: 8, right: 8, left: 0, bottom: data?.period === 'daily' ? 40 : 8 } as const;
  if (loading) return <div className="max-w-7xl mx-auto flex justify-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" /></div>;
  const s = data?.summary;
  return <div className="max-w-7xl mx-auto space-y-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Analytics</h1><p className="text-sm text-gray-600 mt-1">Based on orders that include your products. Amounts are your line items only.</p></div><div className="flex flex-col gap-1 sm:items-end"><label htmlFor="analytics-period" className="text-xs font-medium text-gray-500">Time range</label><select id="analytics-period" value={period} onChange={(e) => setPeriod(e.target.value as SellerAnalyticsPeriod)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 min-w-[200px] focus:border-primary focus:ring-1 focus:ring-primary outline-none">{PERIOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"><div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="text-sm text-gray-500">Total revenue</div><div className="text-2xl font-bold text-primary mt-1">{formatPkr(s?.totalRevenue ?? 0)}</div></div><div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="text-sm text-gray-500">Orders</div><div className="text-2xl font-bold text-gray-900 mt-1">{s?.orderCount ?? 0}</div></div><div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="text-sm text-gray-500">Unique customers</div><div className="text-2xl font-bold text-gray-900 mt-1">{s?.uniqueCustomers ?? 0}</div></div><div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="text-sm text-gray-500">Units sold</div><div className="text-2xl font-bold text-gray-900 mt-1">{s?.unitsSold ?? 0}</div></div><div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="text-sm text-gray-500">Average order value</div><div className="text-2xl font-bold text-primary mt-1">{formatPkr(s?.averageOrderValue ?? 0)}</div></div></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-gray-900 mb-1">{chartCopy.revenue}</h2><p className="text-xs text-gray-500 mb-4">Your store lines in the selected range</p><div className="h-[280px] w-full min-w-0"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartSeries} margin={chartMargins}><defs><linearGradient id="sellerRevFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1DB892" stopOpacity={0.35} /><stop offset="100%" stopColor="#1DB892" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#9ca3af" angle={xAxisAngle} textAnchor={xAxisAngle ? 'end' : 'middle'} height={xAxisHeight} interval={data?.period === 'daily' ? 0 : 'preserveStartEnd'} /><YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" width={48} /><Tooltip formatter={chartTooltipFormatter} /><Area type="monotone" dataKey="revenue" name="revenue" stroke="#1DB892" strokeWidth={2} fill="url(#sellerRevFill)" /></AreaChart></ResponsiveContainer></div></div><div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-gray-900 mb-1">{chartCopy.orders}</h2><p className="text-xs text-gray-500 mb-4">Orders that include at least one of your lines</p><div className="h-[280px] w-full min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartSeries} margin={chartMargins}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#9ca3af" angle={xAxisAngle} textAnchor={xAxisAngle ? 'end' : 'middle'} height={xAxisHeight} interval={data?.period === 'daily' ? 0 : 'preserveStartEnd'} /><YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} width={36} /><Tooltip formatter={chartTooltipFormatter} /><Bar dataKey="orders" name="Orders" fill="#1DB892" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div></div><div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"><div className="px-5 py-4 border-b border-gray-100"><h2 className="text-lg font-semibold text-gray-900">Top products</h2><p className="text-xs text-gray-500 mt-0.5">By revenue from your lines — {topProductsScope}</p></div>{topBars.length === 0 ? <div className="text-center py-14 text-gray-500 text-sm">No product sales in this range.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Title</th><th className="px-5 py-3 text-right">Units</th><th className="px-5 py-3 text-right">Revenue</th></tr></thead><tbody className="divide-y divide-gray-100">{topBars.map((row) => <tr key={row.productId} className="hover:bg-gray-50/80"><td className="px-5 py-3"><span className="font-medium text-gray-900" title={row.fullTitle}>{row.name}</span></td><td className="px-5 py-3 text-right tabular-nums">{row.units}</td><td className="px-5 py-3 text-right font-medium tabular-nums">{formatPkr(row.revenue)}</td></tr>)}</tbody></table></div>}</div></div>;
}

export default function SellerAnalyticsView() {
  return (
    <SellerDashboardShell>
      <SellerAnalyticsPanel />
    </SellerDashboardShell>
  );
}

