'use client';

import { useMemo, useState } from 'react';
import type { LooseRecord } from '@/utils/orderDisplay';
import { useAuth, authUserIsRider } from '@/contexts/AuthContext';
import { useRiderOrders } from '@/features/dashboard/rider/hooks/useRiderOrders';
import { useRiderDashboardUI } from '@/features/dashboard/rider/hooks/useRiderDashboardUI';

const TERMINAL_STATUSES = new Set(['delivered', 'cancelled', 'refunded', 'partially_refunded']);

export function useRiderDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const ui = useRiderDashboardUI();
  const canLoadOrders = !authLoading && isAuthenticated && authUserIsRider(user);
  const { available, mine, loading, refreshOrders, pickOrder, updateOrderStatus } = useRiderOrders({
    enabled: canLoadOrders,
  });
  const { tab, setTab, isAccountOpen, setIsAccountOpen, switchingRole, accountMenuRef, handleSignOut, handleSwitchTo } = ui;
  const [busyId, setBusyId] = useState<string | null>(null);

  // Split "mine" into active (in-progress) and history (delivered only — cancelled orders hidden from rider).
  const activeOrders = useMemo(
    () => mine.filter((o: LooseRecord) => !TERMINAL_STATUSES.has(String(o.status ?? ''))),
    [mine],
  );
  const completedOrders = useMemo(
    () => mine.filter((o: LooseRecord) => String(o.status ?? '') === 'delivered'),
    [mine],
  );
  const deliveredCount = useMemo(
    () => mine.filter((o: LooseRecord) => String(o.status ?? '') === 'delivered').length,
    [mine],
  );

  const pick = async (id: string) => {
    try {
      setBusyId(id);
      await pickOrder(id);
    } catch {
      // onError in useRiderOrders already shows a toast — swallow the re-throw here.
    } finally {
      setBusyId(null);
    }
  };

  const advanceStatus = async (id: string, status: string) => {
    try {
      setBusyId(id);
      await updateOrderStatus({ id, status });
    } catch (err) {
      // onError in useRiderOrders shows a toast; re-throw so OrderCard can display inline error.
      throw err;
    } finally {
      setBusyId(null);
    }
  };

  const rows =
    tab === 'available' ? available :
    tab === 'history'   ? completedOrders :
                          activeOrders;

  return {
    user,
    isAuthenticated,
    authLoading,
    tab,
    setTab,
    available,
    mine,
    activeOrders,
    completedOrders,
    deliveredCount,
    loading,
    busyId,
    isAccountOpen,
    setIsAccountOpen,
    switchingRole,
    accountMenuRef,
    load: refreshOrders,
    handleSignOut,
    handleSwitchTo,
    pick,
    advanceStatus,
    rows,
  };
}
