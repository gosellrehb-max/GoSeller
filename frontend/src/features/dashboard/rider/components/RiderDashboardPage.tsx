"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import {
  FiChevronDown,
  FiLogOut,
  FiUser,
  FiSettings,
  FiAlertCircle,
  FiShoppingBag,
  FiHelpCircle,
  FiMail,
} from "react-icons/fi";
import GoSellerLogo from "@/components/ui/GoSellerLogo";
import { ProductAccordionSection } from "@/features/product/components/ProductAccordionSection";
import { useRiderDashboard } from "@/features/dashboard/rider/hooks/useRiderDashboard";
import { useRiderProfile } from "@/features/account/profile/hooks/useRiderProfile";
import {
  formatOrderDate,
  orderId,
} from "@/features/dashboard/rider/types/riderDashboardTypes";
import {
  formatPkr,
  isCashOnDelivery,
  OrderAddressBlock,
  OrderLineItemsBlock,
  OrderMoneyPanel,
  OrderRecipientBlock,
  OrderSellerPickupDetailsContent,
  paymentMethodLabel,
  type LooseRecord,
} from "@/utils/orderDisplay";
import { authUserIsRider } from "@/contexts/AuthContext";
import { mailtoSupportHref } from "@/lib/supportContact";

function OrderCard({
  o,
  tab,
  busy,
  onPick,
  onAdvance,
  profileComplete,
}: {
  o: LooseRecord;
  tab: "available" | "mine";
  busy: boolean;
  onPick: (id: string) => void;
  onAdvance: (id: string, status: string) => Promise<void>;
  profileComplete: boolean;
}) {
  const id = orderId(o);
  const num = String(o.orderNumber ?? id);
  const total = Number(o.totalAmount ?? o.total ?? 0);
  const status = String(o.status ?? "—");
  const createdAt = o.createdAt;
  const cod = isCashOnDelivery(o);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAdvance = async (nextStatus: string) => {
    setActionError(null);
    try {
      await onAdvance(id, nextStatus);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setActionError(
        e?.response?.data?.message ?? e?.message ?? "Action failed. Please try again.",
      );
    }
  };

  return (
    <article className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#00B207]">
              Order
            </p>
            <p className="font-mono text-lg font-bold text-gray-900">{num}</p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              {formatOrderDate(createdAt)}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium capitalize">
              {status.replace(/_/g, " ")}
            </span>
            {cod ? (
              <>
                <p className="text-xl font-bold text-gray-900 mt-2">
                  {formatPkr(total)}
                </p>
                <p className="text-xs text-gray-500">Collect on delivery</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-800 mt-2">
                  {paymentMethodLabel(o)}
                </p>
                <p className="text-xs text-gray-500">
                  Paid online — no cash to collect
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        <div className="overflow-hidden rounded-lg border border-gray-200 p-2 sm:p-3">
          <ProductAccordionSection
            title="Seller / pickup details"
            defaultOpen={false}
          >
            <OrderSellerPickupDetailsContent o={o} />
          </ProductAccordionSection>
        </div>

        <OrderRecipientBlock o={o} />
        <OrderAddressBlock o={o} />
        <OrderLineItemsBlock o={o} showPrices={cod} />
        <OrderMoneyPanel o={o} showAmounts={cod} />

        <div className="flex flex-col gap-2 pt-1">
          {actionError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
              <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <span>{actionError}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
          {tab === "available" ? (
            <div className="w-full space-y-3">
              <p className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 leading-relaxed">
                Please check pick-up and drop-off addresses and verify the
                details with the seller before accepting this order.
              </p>
              <button
                type="button"
                disabled={busy || !profileComplete}
                title={
                  !profileComplete
                    ? "Please complete your profile to accept deliveries."
                    : "Accept delivery"
                }
                onClick={() => onPick(id)}
                className="text-sm font-medium px-4 py-2.5 rounded-lg bg-[#00B207] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "Please wait…" : "Accept delivery"}
              </button>
            </div>
          ) : (
            <>
              {status === "picked" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleAdvance("out_for_delivery")}
                  className="text-sm px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {busy ? "Please wait…" : "Out for delivery"}
                </button>
              )}
              {status === "out_for_delivery" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleAdvance("delivered")}
                  className="text-sm px-4 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {busy ? "Please wait…" : "Mark delivered"}
                </button>
              )}
              {status === "delivered" && (
                <span className="text-sm text-gray-500 py-2">
                  ✓ Delivered — thank you!
                </span>
              )}
            </>
          )}
          </div>
        </div>
      </div>
    </article>
  );
}

function HistoryCard({ o }: { o: LooseRecord }) {
  const id = orderId(o);
  const num = String(o.orderNumber ?? id);
  const total = Number(o.totalAmount ?? o.total ?? 0);
  const status = String(o.status ?? "—");
  const createdAt = o.createdAt;
  const cod = isCashOnDelivery(o);
  const [open, setOpen] = useState(false);

  return (
    <article className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header row — always visible, click to expand */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 sm:px-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-gray-900 truncate">{num}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 shrink-0" />
              {formatOrderDate(createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                status === "delivered"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {status.replace(/_/g, " ")}
            </span>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">{formatPkr(total)}</p>
          </div>
          <FiChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Expandable detail body */}
      {open && (
        <div className="border-t border-gray-100 p-4 sm:p-5 space-y-5">
          <div className="overflow-hidden rounded-lg border border-gray-200 p-2 sm:p-3">
            <ProductAccordionSection title="Seller / pickup details" defaultOpen={false}>
              <OrderSellerPickupDetailsContent o={o} />
            </ProductAccordionSection>
          </div>
          <OrderRecipientBlock o={o} />
          <OrderAddressBlock o={o} />
          <OrderLineItemsBlock o={o} showPrices={cod} />
          <OrderMoneyPanel o={o} showAmounts={cod} />
        </div>
      )}
    </article>
  );
}

export default function RiderDashboardPage() {
  const {
    user,
    authLoading,
    tab,
    setTab,
    available,
    activeOrders,
    completedOrders,
    deliveredCount,
    loading,
    busyId,
    isAccountOpen,
    setIsAccountOpen,
    switchingRole,
    accountMenuRef,
    load,
    handleSignOut,
    handleSwitchTo,
    pick,
    advanceStatus,
    rows,
  } = useRiderDashboard();

  const { profile } = useRiderProfile();
  const profileComplete = Boolean(
    profile?.phone?.trim() &&
    profile?.address?.trim() &&
    profile?.idNumber?.trim() &&
    profile?.idCardDocumentUrl?.trim(),
  );

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-600">
        Loading…
      </div>
    );
  }

  if (!authUserIsRider(user)) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow border border-gray-200 p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Delivery partners only
          </h1>
          <p className="text-gray-600 mb-6">
            This area is for accounts with the <strong>rider</strong> role.
            Customer and seller accounts use other dashboards.
          </p>
          <Link href="/" className="text-[#00B207] font-medium hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      <header className="sticky top-0 z-20 h-16 border-b border-[#00318a] bg-primary">
        <div className="flex h-full w-full items-center justify-between px-3 sm:px-4 lg:px-6">
          <Link href="/rider" className="inline-flex">
            <GoSellerLogo className="h-8 w-auto" />
          </Link>
          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              onClick={() => setIsAccountOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white hover:bg-white/30"
              aria-label="Account menu"
            >
              <FiUser className="h-5 w-5" />
            </button>
            {isAccountOpen ? (
              <div className="absolute right-0 mt-2 w-52 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                <div className="flex flex-col gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchTo("customer")}
                    disabled={switchingRole}
                    className="flex w-full items-center justify-center gap-2 rounded border border-black bg-transparent px-3 py-1.5 text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiUser className="h-3.5 w-3.5" />
                    <span>Switch to Buyer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchTo("seller")}
                    disabled={switchingRole}
                    className="flex w-full items-center justify-center gap-2 rounded border border-black bg-transparent px-3 py-1.5 text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiShoppingBag className="h-3.5 w-3.5" />
                    <span>Switch to Selling</span>
                  </button>
                </div>
                <div className="my-1 border-t border-gray-100" />
                <Link
                  href="/profile"
                  className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiSettings className="h-4 w-4" />
                  <span>Profile Settings</span>
                </Link>
                <a
                  href={mailtoSupportHref("GoSellr — Help & Support")}
                  className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiHelpCircle className="h-4 w-4 shrink-0" aria-hidden />
                  Help / Support
                </a>
                <a
                  href={mailtoSupportHref("GoSellr — Feedback")}
                  className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiMail className="h-4 w-4 shrink-0" aria-hidden />
                  Feedback
                </a>
                <div className="my-1 border-t border-gray-100" />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <FiLogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main className="h-[calc(100dvh-4rem)] overflow-y-auto">
        {!profileComplete && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 sm:px-6 flex items-start sm:items-center gap-3">
            <FiAlertCircle className="w-5 h-5 text-amber-600 mt-0.5 sm:mt-0 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Please complete your profile to start accepting deliveries.{" "}
              <Link
                href="/profile"
                className="font-semibold underline hover:text-amber-900 transition-colors"
              >
                Complete Profile
              </Link>
            </p>
          </div>
        )}
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Rider dashboard</h1>
          <p className="text-sm text-gray-500">
            Review order details, accept deliveries, update status.
          </p>
        </div>

        {/* Stats strip — clickable tabs */}
        <div className="max-w-3xl mx-auto px-4 pb-2">
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTab("available")}
              className={`rounded-xl border px-4 py-3 text-center transition-colors hover:border-[#00B207] ${tab === "available" ? "border-[#00B207] bg-[#00B207]/5 ring-1 ring-[#00B207]" : "bg-white border-gray-200"}`}
            >
              <p className="text-2xl font-bold text-gray-700">{available.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Available</p>
            </button>
            <button
              type="button"
              onClick={() => setTab("mine")}
              className={`rounded-xl border px-4 py-3 text-center transition-colors hover:border-[#00B207] ${tab === "mine" ? "border-[#00B207] bg-[#00B207]/5 ring-1 ring-[#00B207]" : "bg-white border-gray-200"}`}
            >
              <p className="text-2xl font-bold text-blue-600">{activeOrders.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Active</p>
            </button>
            <button
              type="button"
              onClick={() => setTab("history")}
              className={`rounded-xl border px-4 py-3 text-center transition-colors hover:border-[#00B207] ${tab === "history" ? "border-[#00B207] bg-[#00B207]/5 ring-1 ring-[#00B207]" : "bg-white border-gray-200"}`}
            >
              <p className="text-2xl font-bold text-[#00B207]">{deliveredCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Delivered</p>
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => load()}
              className="px-4 py-2 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-gray-600">Loading orders…</p>
          ) : tab === "history" ? (
            rows.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600">
                No completed deliveries yet.
              </div>
            ) : (
              <div className="space-y-3">
                {rows.map((o) => (
                  <HistoryCard key={orderId(o)} o={o} />
                ))}
              </div>
            )
          ) : rows.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600">
              {tab === "available"
                ? "No orders waiting for pickup right now."
                : "No active deliveries. Check 'Available' to accept new orders."}
            </div>
          ) : (
            <div className="space-y-6">
              {rows.map((o) => {
                const id = orderId(o);
                return (
                  <OrderCard
                    key={id}
                    o={o}
                    tab={tab}
                    busy={busyId === id}
                    onPick={pick}
                    onAdvance={advanceStatus}
                    profileComplete={profileComplete}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
