"use client";

const MATCH = {
  placed: (_s: string) => true,
  processing: (s: string) =>
    [
      "confirmed",
      "processing",
      "ready_for_delivery",
      "picked",
      "out_for_delivery",
      "shipped",
      "delivered",
    ].includes(s),
  readyDelivery: (s: string) =>
    ["ready_for_delivery", "picked", "out_for_delivery", "delivered"].includes(
      s,
    ),
  courier: (s: string) =>
    ["picked", "out_for_delivery", "delivered"].includes(s),
  out: (s: string) => ["out_for_delivery", "delivered"].includes(s),
  done: (s: string) => s === "delivered",
};

const TRACKING_STEPS_CUSTOMER: {
  match: (s: string) => boolean;
  label: string;
  description: string;
}[] = [
  {
    match: MATCH.placed,
    label: "Order placed",
    description: "We received your order.",
  },
  {
    match: MATCH.processing,
    label: "Processing",
    description: "Seller is preparing your items.",
  },
  {
    match: MATCH.readyDelivery,
    label: "Ready for delivery",
    description: "Order is ready to be picked up by a rider.",
  },
  {
    match: MATCH.courier,
    label: "Courier assigned",
    description: "A rider has accepted your order.",
  },
  {
    match: MATCH.out,
    label: "Out for delivery",
    description: "Your order is on the way to you.",
  },
  {
    match: MATCH.done,
    label: "Delivered",
    description: "Your order has been delivered.",
  },
];

const TRACKING_STEPS_SELLER: {
  match: (s: string) => boolean;
  label: string;
  description: string;
}[] = [
  {
    match: MATCH.placed,
    label: "Order placed",
    description: "Customer placed this order for your products.",
  },
  {
    match: MATCH.processing,
    label: "Processing",
    description: "Prepare and pack items for handoff.",
  },
  {
    match: MATCH.readyDelivery,
    label: "Ready for delivery",
    description: "Order is ready for rider pickup.",
  },
  {
    match: MATCH.courier,
    label: "Rider assigned",
    description: "A rider picked up this order.",
  },
  {
    match: MATCH.out,
    label: "Out for delivery",
    description: "Rider is taking the order to the customer.",
  },
  {
    match: MATCH.done,
    label: "Delivered",
    description: "Rider marked the order as delivered.",
  },
];

export function OrderTrackingTimeline({
  status,
  variant = "customer",
  showHeading = true,
}: {
  status: string;
  variant?: "customer" | "seller";
  showHeading?: boolean;
}) {
  const steps =
    variant === "seller" ? TRACKING_STEPS_SELLER : TRACKING_STEPS_CUSTOMER;
  const s = (status || "pending").toLowerCase();
  if (s === "cancelled" || s === "refunded" || s === "partially_refunded") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        Order status:{" "}
        <span className="font-semibold capitalize">{s.replace(/_/g, " ")}</span>
      </div>
    );
  }

  return (
    <div className={showHeading ? "mt-3 space-y-0" : "space-y-0"}>
      {showHeading ? (
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Order tracking
        </p>
      ) : null}
      <ol className="relative border-l border-gray-200 ml-2.5 space-y-4">
        {steps.map((step, i) => {
          const active = step.match(s);
          const next = steps[i + 1];
          const isCurrent =
            active && (i === steps.length - 1 || !next?.match(s));

          return (
            <li key={step.label} className="ml-4">
              <span
                className={`absolute flex items-center justify-center w-5 h-5 rounded-full -left-2.5 ring-4 ring-white ${
                  active ? "bg-emerald-500" : "bg-gray-200"
                } ${isCurrent ? "ring-emerald-100" : ""}`}
              >
                {active ? (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    viewBox="0 0 8 8"
                  >
                    <path
                      fill="currentColor"
                      d="M2.5 7L0 4.5l1-1 1.5 1.5L7 0l1 1-5.5 5.5z"
                    />
                  </svg>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                )}
              </span>
              <div className={`${active ? "text-gray-900" : "text-gray-400"}`}>
                <p
                  className={`text-sm font-medium ${isCurrent ? "text-emerald-700" : ""}`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
