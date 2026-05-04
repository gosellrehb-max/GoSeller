'use client';

import type { LooseRecord } from '@/utils/orderDisplay';

export type RiderTab = 'available' | 'mine' | 'history';

export function orderId(o: { _id?: unknown; id?: string }) {
  const x = o._id ?? o.id;
  return typeof x === 'object' && x !== null && 'toString' in x
    ? String((x as { toString(): string }).toString())
    : String(x ?? '');
}

export function formatOrderDate(createdAt: unknown): string {
  if (!createdAt) return '—';
  try {
    const d = new Date(createdAt as string);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

export type RiderOrders = {
  available: LooseRecord[];
  mine: LooseRecord[];
};
