"use client";

import Link from "next/link";
import { ProductAccordionSection } from "@/features/product/components/ProductAccordionSection";
import {
  formatPkr,
  OrderAddressBlock,
  OrderLineItemsBlock,
  OrderMoneyPanel,
  OrderRecipientBlock,
  OrderSellerPickupDetailsContent,
  RiderDetailsBlock,
  type LooseRecord,
} from "@/utils/orderDisplay";
import {
  CANCELLABLE_ORDER_STATUSES,
  formatOrderStatusLabel,
  getStatusColor,
} from "./orderStatusUi";
import { OrderTrackingTimeline } from "./OrderTrackingTimeline";
import type { CustomerTab, UiOrder } from "./types";

const CANCELLABLE = new Set<string>(CANCELLABLE_ORDER_STATUSES);

export function ExpandableOrderCard({
  order,
  isSeller,
  sellerUserId,
  cancellingOrderId,
  cancelReason,
  cancelSubmitting,
  onStartCancel,
  onCancelReasonChange,
  onConfirmCancel,
  onDismissCancel,
}: {
  order: UiOrder;
  isSeller: boolean;
  sellerUserId?: string;
  cancellingOrderId: string | null;
  cancelReason: string;
  cancelSubmitting: boolean;
  onStartCancel: (orderId: string) => void;
  onCancelReasonChange: (v: string) => void;
  onConfirmCancel: (orderId: string) => void;
  onDismissCancel: () => void;
}) {
  const raw = order.raw as LooseRecord;
  const cancelledBy = raw.cancelledBy as string | undefined;
  const cancellationReason = raw.cancellationReason as string | undefined;

  const canCancel = CANCELLABLE.has(order.status) && cancellingOrderId !== order.id;

  return (
    <div className="flex flex-col">
      <details className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none flex-wrap justify-between gap-3 px-4 sm:px-5 py-4 border-b border-gray-100 bg-gray-50/80 hover:bg-gray-100 transition-colors">
          <div className="flex flex-1 items-start gap-4">
            <div className="mt-1 flex-shrink-0 transition-transform duration-200 group-open:rotate-180 text-gray-400">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order</p>
              <p className="font-semibold text-gray-900">{order.orderNumber}</p>
              <p className="text-xs text-gray-500 mt-0.5">{order.date}</p>
              {isSeller ? (
                <p className="text-xs text-gray-600 mt-2">
                  Customer:{" "}
                  <span className="font-medium">{order.customer}</span>
                </p>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}
            >
              {formatOrderStatusLabel(order.status)}
            </span>
            {cancelledBy ? (
              <p className="text-xs font-medium mt-1 text-red-600">
                Cancelled by {cancelledBy}
              </p>
            ) : null}
            <p className="text-sm font-medium text-gray-900 mt-2">
              {formatPkr(order.total)}
            </p>
            <p className="text-xs text-gray-500">{order.items} item(s)</p>
          </div>
        </summary>
        <div className="px-3 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
          <div className="overflow-hidden rounded-lg border border-gray-200 p-3 sm:p-4">
            {cancellationReason ? (
              <div className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                <span className="font-medium">Cancellation reason:</span>{" "}
                {cancellationReason}
              </div>
            ) : null}
            <ProductAccordionSection title="Order details" defaultOpen>
              <div className="space-y-5">
                <OrderRecipientBlock o={raw} />
                <OrderAddressBlock o={raw} />
                <OrderLineItemsBlock o={raw} showPrices />
                <OrderMoneyPanel o={raw} showAmounts />
              </div>
            </ProductAccordionSection>
            {isSeller ? (
              <ProductAccordionSection
                title="Pickup details (visible to riders)"
                defaultOpen={false}
              >
                <p className="mb-3 text-xs text-gray-600 leading-relaxed">
                  Riders see this seller and store information so they can
                  confirm pick-up with you before accepting the delivery.
                </p>
                <OrderSellerPickupDetailsContent
                  o={raw}
                  onlySellerUserId={sellerUserId}
                />
              </ProductAccordionSection>
            ) : null}
            {isSeller ? (
              <ProductAccordionSection title="Rider details">
                <RiderDetailsBlock o={raw} variant="seller" />
              </ProductAccordionSection>
            ) : null}
            <ProductAccordionSection title="Order tracking" defaultOpen>
              <OrderTrackingTimeline
                status={order.status}
                variant={isSeller ? "seller" : "customer"}
                showHeading={false}
              />
              {order.status === "out_for_delivery" ||
              order.status === "delivered" ? (
                <p className="mt-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  {isSeller
                    ? order.status === "out_for_delivery"
                      ? "Rider marked this order out for delivery — it’s on the way to the customer."
                      : "Rider marked this order as delivered to the customer."
                    : order.status === "out_for_delivery"
                      ? "Your order is on the way — the rider marked it out for delivery."
                      : "Your order was delivered — the rider marked it as delivered."}
                </p>
              ) : null}
            </ProductAccordionSection>
          </div>
        </div>
      </details>
      {canCancel ? (
        <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white px-4 py-3">
          <button
            type="button"
            onClick={() => {
              onStartCancel(order.id);
            }}
            className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
          >
            Cancel this order
          </button>
        </div>
      ) : null}
      {cancellingOrderId === order.id ? (
        <div className="rounded-b-xl border border-t-0 border-red-200 bg-red-50 px-4 py-4 space-y-3">
          <p className="text-sm font-semibold text-red-800">
            Cancel order {order.orderNumber}?
          </p>
          <p className="text-xs text-red-600">
            This cannot be undone. The order will be marked as cancelled
            {isSeller ? " by seller" : " by customer"}.
          </p>
          <textarea
            value={cancelReason}
            onChange={(e) => onCancelReasonChange(e.target.value)}
            placeholder="Reason for cancellation (optional)"
            rows={2}
            className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={cancelSubmitting}
              onClick={() => onConfirmCancel(order.id)}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {cancelSubmitting ? "Cancelling…" : "Confirm cancellation"}
            </button>
            <button
              type="button"
              disabled={cancelSubmitting}
              onClick={onDismissCancel}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              Never mind
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Shared empty state when a tab filter yields no orders */
export function OrdersTabEmptyState({
  ordersLength,
  isSeller,
  activeTab,
}: {
  ordersLength: number;
  isSeller: boolean;
  activeTab: CustomerTab;
}) {
  const emptyCopy =
    activeTab === "in_progress"
      ? isSeller
        ? "No active orders right now."
        : "No orders currently in progress."
      : activeTab === "cancelled"
        ? "No cancelled or refunded orders."
        : isSeller
          ? "No completed orders yet."
          : "No delivered orders yet.";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-600 space-y-5">
      <p>
        {ordersLength === 0
          ? isSeller
            ? "No orders yet for your products. When customers buy your items, those orders appear here with full tracking."
            : "You don't have any orders yet."
          : emptyCopy}
      </p>
      {ordersLength === 0 ? (
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 transition-colors"
        >
          Home
        </Link>
      ) : null}
    </div>
  );
}
