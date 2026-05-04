"use client";

import React, { Suspense, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { AccountOrdersSidebar } from "./orders/AccountOrdersSidebar";
import { AdminOrdersTable } from "./orders/AdminOrdersTable";
import {
  ExpandableOrderCard,
  OrdersTabEmptyState,
} from "./orders/ExpandableOrderCard";
import { WishlistPanel } from "./orders/WishlistPanel";
import { CUSTOMER_TAB_STATUSES, type CustomerTab } from "./orders/types";
import { computeOrdersDashboardStats } from "./orders/orderStats";
import { useDashboardOrdersQuery } from "./orders/useDashboardOrdersQuery";
import { useOrderCancellation } from "./orders/useOrderCancellation";

function OrdersContent() {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSeller = user?.role === "seller";
  const isAdmin = user?.role === "admin" || user?.role === "super-admin";
  const [activeTab, setActiveTab] = useState<CustomerTab>("in_progress");
  const roleForQuery = user?.role ?? "guest";

  const showTrackingView = !!user && !isAdmin;
  const {
    orders,
    isLoading: loading,
    errorMessage,
    refetch,
  } = useDashboardOrdersQuery({
    role: user?.role,
    isAuthenticated,
    refetchInterval: showTrackingView ? 30_000 : false,
  });

  const {
    cancellingOrderId,
    setCancellingOrderId,
    cancelReason,
    setCancelReason,
    cancelSubmitting,
    handleCancelOrder,
  } = useOrderCancellation(roleForQuery);

  const stats = useMemo(
    () => computeOrdersDashboardStats(orders),
    [orders],
  );

  const ordersBase =
    pathname === "/seller/orders" || pathname?.startsWith("/seller/orders")
      ? "/seller/orders"
      : pathname === "/orders"
        ? "/orders"
        : "/dashboard/orders";
  const isSellerOrdersPage =
    isSeller &&
    (pathname === "/seller/orders" || pathname?.startsWith("/seller/orders"));
  const section =
    searchParams?.get("section") === "wishlist" ? "wishlist" : "orders";
  const effectiveSection = isSellerOrdersPage ? "orders" : section;
  const { ids: wishlistIds, isLoading: wishlistLoading } = useWishlist();
  const sidebarActive =
    effectiveSection === "wishlist" ? "wishlist" : "orders";

  if (showTrackingView) {
    return (
      <div className="min-h-screen bg-wm-page px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl flex w-full min-w-0 flex-col justify-start gap-6 lg:flex-row lg:items-stretch lg:justify-start lg:gap-6 xl:gap-8">
          {!isSellerOrdersPage ? (
            <AccountOrdersSidebar
              activeNav={sidebarActive}
              ordersHref={ordersBase}
              wishlistHref={`${ordersBase}?section=wishlist`}
            />
          ) : null}
          <div className="min-w-0 flex-1 space-y-6 lg:min-h-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0 flex-1">
                <p className="max-w-2xl text-gray-600">
                  {effectiveSection === "wishlist" ? (
                    <>
                      Products you’ve saved to your wishlist. Remove items here
                      or open a product to buy.
                    </>
                  ) : isSeller ? (
                    <>
                      Track orders that include your products — same delivery
                      status the customer sees: when a rider marks{" "}
                      <strong>out for delivery</strong> or{" "}
                      <strong>delivered</strong>, it updates here.
                    </>
                  ) : (
                    <>
                      Track your orders — you’ll see when a rider marks them{" "}
                      <strong>out for delivery</strong> or{" "}
                      <strong>delivered</strong>.
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                className="shrink-0 self-start rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
            {errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {errorMessage}
              </div>
            ) : null}
            {effectiveSection === "wishlist" ? (
              <WishlistPanel
                wishlistIds={wishlistIds}
                isLoading={wishlistLoading}
              />
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("in_progress")}
                    className={`rounded-lg border p-4 text-left cursor-pointer transition-colors hover:border-primary ${activeTab === "in_progress" ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-white"}`}
                  >
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.pending + stats.inProgress}
                    </div>
                    <div className="text-sm text-gray-500">
                      {isSeller ? "Active orders" : "In progress"}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("delivered")}
                    className={`rounded-lg border p-4 text-left cursor-pointer transition-colors hover:border-primary ${activeTab === "delivered" ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-white"}`}
                  >
                    <div className="text-2xl font-bold text-green-600">
                      {stats.delivered}
                    </div>
                    <div className="text-sm text-gray-500">
                      {isSeller ? "Completed" : "Delivered"}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("cancelled")}
                    className={`rounded-lg border p-4 text-left cursor-pointer transition-colors hover:border-primary ${activeTab === "cancelled" ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-white"}`}
                  >
                    <div className="text-2xl font-bold text-red-600">
                      {stats.cancelled}
                    </div>
                    <div className="text-sm text-gray-500">
                      Cancelled / refunded
                    </div>
                  </button>
                </div>

                {loading ? (
                  <p className="text-gray-600">Loading orders...</p>
                ) : (() => {
                  const visibleOrders = orders.filter((o) =>
                    CUSTOMER_TAB_STATUSES[activeTab].includes(o.status),
                  );
                  if (visibleOrders.length === 0) {
                    return (
                      <OrdersTabEmptyState
                        ordersLength={orders.length}
                        isSeller={isSeller}
                        activeTab={activeTab}
                      />
                    );
                  }
                  return (
                    <div className="space-y-6">
                      {visibleOrders.map((order) => (
                        <ExpandableOrderCard
                          key={order.id}
                          order={order}
                          isSeller={isSeller}
                          sellerUserId={user?.id}
                          cancellingOrderId={cancellingOrderId}
                          cancelReason={cancelReason}
                          cancelSubmitting={cancelSubmitting}
                          onStartCancel={(id) => {
                            setCancellingOrderId(id);
                            setCancelReason("");
                          }}
                          onCancelReasonChange={setCancelReason}
                          onConfirmCancel={handleCancelOrder}
                          onDismissCancel={() => setCancellingOrderId(null)}
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminOrdersTable
      orders={orders}
      loading={loading}
      stats={stats}
      errorMessage={errorMessage}
    />
  );
}

export default function OrdersView() {
  return (
    <Suspense
      fallback={<div className="w-full p-6 text-gray-600">Loading…</div>}
    >
      <OrdersContent />
    </Suspense>
  );
}
