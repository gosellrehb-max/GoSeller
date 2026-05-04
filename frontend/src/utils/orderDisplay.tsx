'use client';

import { CreditCard, MapPin, Package, Phone, Store, User } from 'lucide-react';
import type { Product } from '@/services/api';
import { calculatePrices } from '@/utils/productDiscount';

export type LooseRecord = Record<string, unknown>;

/**
 * Payable unit + line for order display: matches catalog discount rules when `product` is populated
 * (fixes legacy orders where only list `price` was stored on the line).
 */
export function lineAmountsFromItem(item: LooseRecord): { unit: number; line: number } {
  const qty = Math.max(1, Number(item.quantity ?? 1));
  const prod = item.product;
  if (prod && typeof prod === 'object' && prod !== null && 'price' in prod && (prod as LooseRecord).price != null) {
    const u = calculatePrices(prod as Product).finalPrice;
    return { unit: u, line: u * qty };
  }
  const unit = Number(item.price ?? 0);
  const line = item.totalPrice != null ? Number(item.totalPrice) : unit * qty;
  return { unit, line };
}

function orderItemsLineSubtotal(items: unknown): number {
  if (!Array.isArray(items) || items.length === 0) return 0;
  return items.reduce((sum, raw) => sum + lineAmountsFromItem(raw as LooseRecord).line, 0);
}

/** Grand total for list cards / headers: line-based when items allow, else stored order total. */
export function orderDisplayGrandTotal(o: LooseRecord): number {
  const lineSubtotal = orderItemsLineSubtotal(o.items);
  const tax = Number(o.tax ?? 0);
  const shippingCost = Number(o.shippingCost ?? 0);
  if (Array.isArray(o.items) && o.items.length > 0 && lineSubtotal > 0) {
    return lineSubtotal + tax + shippingCost;
  }
  return Number(o.totalAmount ?? o.total ?? 0);
}

export function formatPkr(n: number): string {
  if (!Number.isFinite(n)) return 'PKR 0.00';
  return `PKR ${n.toFixed(2)}`;
}

export function isCashOnDelivery(o: LooseRecord): boolean {
  const p = o.payment;
  if (!p || typeof p !== 'object') return false;
  const m = String((p as LooseRecord).method ?? '').toLowerCase();
  return m === 'cash_on_delivery' || m === 'cod';
}

export function getShipping(o: LooseRecord): LooseRecord | null {
  const sa = o.shippingAddress;
  if (!sa || typeof sa !== 'object') return null;
  return sa as LooseRecord;
}

export function recipientName(o: LooseRecord): string {
  const sa = getShipping(o);
  if (sa) {
    const fn = String(sa.firstName ?? '').trim();
    const ln = String(sa.lastName ?? '').trim();
    if (fn || ln) return [fn, ln].filter(Boolean).join(' ');
  }
  const c = o.customer;
  if (c && typeof c === 'object') {
    const cu = c as LooseRecord;
    const fn = String(cu.firstName ?? '').trim();
    const ln = String(cu.lastName ?? '').trim();
    if (fn || ln) return [fn, ln].filter(Boolean).join(' ');
  }
  return 'Customer';
}

export function recipientPhone(o: LooseRecord): string {
  const sa = getShipping(o);
  if (sa?.phone) return String(sa.phone);
  const c = o.customer;
  if (c && typeof c === 'object') {
    const p = (c as LooseRecord).phone;
    if (p) return String(p);
  }
  return '—';
}

export function recipientEmail(o: LooseRecord): string {
  const sa = getShipping(o);
  if (sa?.email) return String(sa.email);
  const c = o.customer;
  if (c && typeof c === 'object') {
    const e = (c as LooseRecord).email;
    if (e) return String(e);
  }
  return '—';
}

export function fullDeliveryAddress(o: LooseRecord): string[] {
  const sa = getShipping(o);
  if (!sa) return ['No address on file'];
  const addr = sa.address;
  if (!addr || typeof addr !== 'object') return ['No street address'];
  const a = addr as LooseRecord;
  const street = String(a.street ?? '').trim();
  const city = String(a.city ?? '').trim();
  const state = String(a.state ?? '').trim();
  const zip = String(a.zipCode ?? '').trim();
  const country = String(a.country ?? '').trim();
  const line2 = [city, state, zip].filter(Boolean).join(', ');
  const lines: string[] = [];
  if (street) lines.push(street);
  if (line2) lines.push(line2);
  if (country) lines.push(country);
  return lines.length ? lines : ['—'];
}

const METHOD_LABELS: Record<string, string> = {
  cash_on_delivery: 'Cash on delivery',
  cod: 'Cash on delivery',
  credit_card: 'Card',
  debit_card: 'Card',
  jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa',
  dummy: 'Test / other',
};

export function paymentMethodLabel(o: LooseRecord): string {
  const p = o.payment;
  if (!p || typeof p !== 'object') return '—';
  const raw = String((p as LooseRecord).method ?? '');
  return (METHOD_LABELS[raw] ?? raw.replace(/_/g, ' ')) || '—';
}

/** Full payment line for seller/customer (PKR amounts). */
export function paymentSummaryPkr(o: LooseRecord): string {
  const p = o.payment;
  if (!p || typeof p !== 'object') return '—';
  const pay = p as LooseRecord;
  const method = paymentMethodLabel(o);
  const status = String(pay.status ?? '');
  const amt =
    pay.amount != null
      ? Number(pay.amount)
      : Number(o.totalAmount ?? o.total ?? 0);
  const bits = [method, status && `(${status})`, Number.isFinite(amt) && formatPkr(amt)].filter(Boolean);
  return bits.join(' · ') || '—';
}

/** Rider-facing: method + status only (no amounts) when not COD. */
export function paymentSummaryNoAmount(o: LooseRecord): string {
  const p = o.payment;
  if (!p || typeof p !== 'object') return '—';
  const pay = p as LooseRecord;
  const method = paymentMethodLabel(o);
  const status = String(pay.status ?? '');
  const bits = [method, status && `(${status})`].filter(Boolean);
  return bits.join(' · ') || '—';
}

export function getAssignedRider(o: LooseRecord): LooseRecord | null {
  const r = o.assignedRiderId;
  if (!r || typeof r !== 'object') return null;
  return r as LooseRecord;
}

export function OrderItemsList({ items, showPrices }: { items: unknown; showPrices: boolean }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-sm text-gray-500">No line items.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((raw, idx) => {
        const item = raw as LooseRecord;
        const prod = item.product;
        let title = 'Product';
        let thumb: string | undefined;
        if (prod && typeof prod === 'object') {
          const p = prod as LooseRecord;
          title = String(p.title ?? 'Product');
          const imgs = p.images;
          if (Array.isArray(imgs) && imgs[0]) thumb = String(imgs[0]);
        }
        const qty = Number(item.quantity ?? 1);
        const { unit: unitPrice, line: displayLine } = lineAmountsFromItem(item);
        return (
          <li
            key={idx}
            className="flex gap-3 items-start text-sm border border-gray-100 rounded-lg p-2 bg-gray-50/80"
          >
            <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-gray-200">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element -- product URLs from API may be any host
                <img src={thumb} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 line-clamp-2">{title}</p>
              <p className="text-gray-600 text-xs mt-0.5">
                Qty {qty}
                {showPrices && (
                  <>
                    {' '}
                    × {formatPkr(unitPrice)}{' '}
                    <span className="text-gray-800 font-semibold ml-1">{formatPkr(displayLine)}</span>
                  </>
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function OrderRecipientBlock({ o }: { o: LooseRecord }) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <User className="w-3.5 h-3.5" />
        Recipient & contact
      </h3>
      <p className="font-semibold text-gray-900">{recipientName(o)}</p>
      <div className="mt-2 space-y-1 text-sm text-gray-700">
        <p className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-400 shrink-0" />
          <a
            href={`tel:${recipientPhone(o).replace(/\s/g, '')}`}
            className="text-primary font-medium hover:underline"
          >
            {recipientPhone(o)}
          </a>
        </p>
        <p className="pl-6 text-gray-600 break-all">{recipientEmail(o)}</p>
      </div>
    </section>
  );
}

export function OrderAddressBlock({ o }: { o: LooseRecord }) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5" />
        Deliver to
      </h3>
      <div className="text-sm text-gray-800 leading-relaxed pl-0.5">
        {fullDeliveryAddress(o).map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </section>
  );
}

export function OrderLineItemsBlock({ o, showPrices }: { o: LooseRecord; showPrices: boolean }) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <Package className="w-3.5 h-3.5" />
        Items ({Array.isArray(o.items) ? o.items.length : 0})
      </h3>
      <OrderItemsList items={o.items} showPrices={showPrices} />
    </section>
  );
}

export function OrderMoneyPanel({ o, showAmounts }: { o: LooseRecord; showAmounts: boolean }) {
  const shippingCost = Number(o.shippingCost ?? 0);
  const tax = Number(o.tax ?? 0);
  const lineSubtotal = orderItemsLineSubtotal(o.items);
  const fallbackTotal = Number(o.totalAmount ?? o.total ?? 0);
  const subtotalFromOrder = Number(o.subtotal ?? fallbackTotal);
  const subtotal = lineSubtotal > 0 ? lineSubtotal : subtotalFromOrder;
  const total = orderDisplayGrandTotal(o);

  if (!showAmounts) {
    return (
      <section className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
        <p className="text-gray-700">
          <span className="font-medium text-gray-900">Payment:</span> {paymentSummaryNoAmount(o)}
        </p>
        
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
      <div className="flex justify-between py-0.5 text-gray-600">
        <span>Subtotal</span>
        <span>{formatPkr(subtotal)}</span>
      </div>
      {tax > 0 && (
        <div className="flex justify-between py-0.5 text-gray-600">
          <span>Tax</span>
          <span>{formatPkr(tax)}</span>
        </div>
      )}
      {shippingCost > 0 && (
        <div className="flex justify-between py-0.5 text-gray-600">
          <span>Shipping</span>
          <span>{formatPkr(shippingCost)}</span>
        </div>
      )}
      <div className="flex justify-between pt-2 mt-2 border-t border-gray-200 font-semibold text-gray-900">
        <span>Order total</span>
        <span>{formatPkr(total)}</span>
      </div>
      <div className="flex items-start gap-2 mt-3 pt-2 border-t border-gray-200 text-xs text-gray-600">
        <CreditCard className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
        <span>{paymentSummaryPkr(o)}</span>
      </div>
    </section>
  );
}

export function RiderDetailsBlock({
  o,
  variant = 'customer',
}: {
  o: LooseRecord;
  variant?: 'customer' | 'seller';
}) {
  const r = getAssignedRider(o);
  if (!r) {
    return (
      <p className="text-sm text-gray-600">
        No rider has accepted this order yet. When a rider picks it up, their contact details will appear here.
      </p>
    );
  }
  const name =
    [String(r.firstName ?? '').trim(), String(r.lastName ?? '').trim()].filter(Boolean).join(' ') || 'Rider';
  const phone = r.phone != null ? String(r.phone).trim() : '';
  const displayPhone = phone || '—';
  const email = r.email != null ? String(r.email) : '—';
  const sellerExtras = variant === 'seller';
  const riderAddress = r.riderAddress != null ? String(r.riderAddress).trim() : '';
  const riderIdNumber = r.riderIdNumber != null ? String(r.riderIdNumber).trim() : '';
  const idCardUrl = r.idCardDocumentUrl != null ? String(r.idCardDocumentUrl).trim() : '';

  return (
    <div className="space-y-3 text-sm text-gray-800">
      <p className="font-semibold text-gray-900">{name}</p>
      <p className="flex items-center gap-2">
        <Phone className="w-4 h-4 shrink-0 text-gray-400" />
        {displayPhone !== '—' ? (
          <a href={`tel:${displayPhone.replace(/\s/g, '')}`} className="font-medium text-primary hover:underline">
            {displayPhone}
          </a>
        ) : (
          <span className="text-gray-500">—</span>
        )}
      </p>
      <p className="flex items-start gap-2 break-all">
        <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <span>{email}</span>
      </p>
      {sellerExtras && riderAddress ? (
        <div className="border-t border-gray-100 pt-3">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Rider address</h4>
          <p className="flex items-start gap-2 leading-relaxed text-gray-700">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <span>{riderAddress}</span>
          </p>
        </div>
      ) : null}
      {sellerExtras && riderIdNumber ? (
        <div className="border-t border-gray-100 pt-3">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Government ID (CNIC / ID no.)</h4>
          <p className="font-mono text-gray-900">{riderIdNumber}</p>
        </div>
      ) : null}
      {sellerExtras && idCardUrl ? (
        <div className="border-t border-gray-100 pt-3">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">ID card (on file)</h4>
          {/* eslint-disable-next-line @next/next/no-img-element -- URL from our upload/CDN */}
          <a href={idCardUrl} target="_blank" rel="noopener noreferrer" className="inline-block max-w-full">
            <img
              src={idCardUrl}
              alt="Rider national ID document"
              className="max-h-56 max-w-full rounded-lg border border-gray-200 object-contain shadow-sm"
            />
          </a>
          <p className="mt-2 text-xs text-gray-500">
            <a href={idCardUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
              Open full size
            </a>
          </p>
        </div>
      ) : null}
      {sellerExtras && !idCardUrl && (riderIdNumber || riderAddress) ? (
        <p className="text-xs text-amber-800">No ID card image on file for this rider (registered before upload was required).</p>
      ) : null}
    </div>
  );
}

/** Unique seller accounts on an order with optional populated Seller (store) from line items’ product. */
export function collectSellerPickupRows(o: LooseRecord): { user: LooseRecord; shop: LooseRecord | null }[] {
  const items = Array.isArray(o.items) ? o.items : [];
  const byUser = new Map<string, { user: LooseRecord; shop: LooseRecord | null }>();
  for (const raw of items) {
    const it = raw as LooseRecord;
    const su = it.seller;
    if (!su || typeof su !== 'object') continue;
    const uid = String((su as LooseRecord)._id ?? (su as LooseRecord).id ?? '');
    const key = uid || `row-${byUser.size}`;
    const prod = it.product;
    let shop: LooseRecord | null = null;
    if (prod && typeof prod === 'object') {
      const sid = (prod as LooseRecord).sellerId;
      if (sid && typeof sid === 'object') shop = sid as LooseRecord;
    }
    const prev = byUser.get(key);
    if (!prev) {
      byUser.set(key, { user: su as LooseRecord, shop });
    } else if (shop && !prev.shop) {
      prev.shop = shop;
    }
  }
  return Array.from(byUser.values());
}

function sellerBusinessLines(shop: LooseRecord): string[] {
  const lines: string[] = [];
  const rawAreas = shop.areaOfDistribution;
  const areas = Array.isArray(rawAreas)
    ? rawAreas.map((x) => String(x).trim()).filter(Boolean)
    : String(rawAreas ?? '')
        .trim()
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
  const addr =
    (areas.length ? areas.join(', ') : '') || String(shop.businessAddress ?? '').trim();
  const city = String(shop.city ?? '').trim();
  const state = String(shop.state ?? '').trim();
  const zip = String(shop.zipCode ?? '').trim();
  const country = String(shop.country ?? '').trim();
  const line2 = [city, state, zip].filter(Boolean).join(', ');
  if (addr) lines.push(addr);
  if (line2) lines.push(line2);
  if (country) lines.push(country);
  return lines.length ? lines : [];
}

/** Multiline store pickup address from seller profile (registration / settings). */
function sellerPickupAddressLines(shop: LooseRecord): string[] {
  const raw = String(shop.storePickupAddress ?? '').trim();
  if (!raw) return [];
  return raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

/** First line item for this seller user with a product-level pickup location (add-product field). */
function productPickupLinesForOrderSeller(o: LooseRecord, sellerUserId: string): string[] | null {
  const items = Array.isArray(o.items) ? o.items : [];
  for (const raw of items) {
    const it = raw as LooseRecord;
    const su = it.seller;
    if (!su || typeof su !== 'object') continue;
    const uid = String((su as LooseRecord)._id ?? (su as LooseRecord).id ?? '');
    if (uid !== sellerUserId) continue;
    const prod = it.product;
    if (prod && typeof prod === 'object') {
      const loc = String((prod as LooseRecord).orderPickupLocation ?? '').trim();
      if (loc) {
        return loc.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      }
    }
  }
  return null;
}

/** Seller user + store/pickup info (requires API populate). Optional filter for multi-vendor orders (seller dashboard). */
export function OrderSellerPickupDetailsContent({
  o,
  onlySellerUserId,
}: {
  o: LooseRecord;
  /** When set, only the row matching this seller user id is shown (e.g. logged-in seller on `/seller/orders`). */
  onlySellerUserId?: string;
}) {
  let rows = collectSellerPickupRows(o);
  if (onlySellerUserId) {
    rows = rows.filter((r) => {
      const id = String(r.user._id ?? r.user.id ?? '');
      return id === onlySellerUserId;
    });
  }
  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        {onlySellerUserId
          ? 'We could not load your pickup details for this order. Check that your seller profile and store address are complete, then refresh.'
          : 'Seller contact and pickup details are not available for this order. If something looks wrong, contact support before accepting.'}
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {rows.map((row, i) => {
        const u = row.user;
        const name =
          [String(u.firstName ?? '').trim(), String(u.lastName ?? '').trim()].filter(Boolean).join(' ') ||
          String(u.email ?? 'Seller');
        const userPhoneRaw = u.phone != null ? String(u.phone).trim() : '';
        const email = u.email != null ? String(u.email) : '—';
        const shop = row.shop;
        const businessName = shop ? String(shop.businessName ?? '').trim() : '';
        const shopPhone = shop && shop.phone != null ? String(shop.phone).trim() : '';
        /** Account phone or seller-profile phone — riders need at least one. */
        const sellerPhoneForRider = userPhoneRaw || shopPhone || '';
        const sellerUid = String(u._id ?? u.id ?? '');
        const productPickupLines = productPickupLinesForOrderSeller(o, sellerUid);
        const shopPickupLines = shop ? sellerPickupAddressLines(shop) : [];
        const pickupLines = productPickupLines ?? shopPickupLines;
        const pickupFromProduct = productPickupLines != null;
        const registeredLines = shop ? sellerBusinessLines(shop) : [];
        const pinLines = pickupLines.length > 0 ? pickupLines : registeredLines;
        const hasStoreBlock = shop && (businessName || shopPhone || pinLines.length > 0);

        return (
          <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/80 p-3 text-sm text-gray-800">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Seller contact</p>
            <p className="font-semibold text-gray-900">{name}</p>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500">Seller phone</p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                {sellerPhoneForRider ? (
                  <a
                    href={`tel:${sellerPhoneForRider.replace(/\s/g, '')}`}
                    className="text-primary font-medium hover:underline"
                  >
                    {sellerPhoneForRider}
                  </a>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </p>
              <p className="flex items-start gap-2 break-all pl-0">
                <User className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <span>{email}</span>
              </p>
            </div>
            {hasStoreBlock ? (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  Store / pickup location
                </p>
                {businessName ? <p className="font-medium text-gray-900">{businessName}</p> : null}
                {shopPhone && userPhoneRaw && shopPhone !== userPhoneRaw ? (
                  <p className="flex flex-col gap-0.5 mt-1">
                    <span className="text-xs text-gray-500">Store / business phone</span>
                    <span className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                      <a href={`tel:${shopPhone.replace(/\s/g, '')}`} className="text-primary font-medium hover:underline">
                        {shopPhone}
                      </a>
                    </span>
                  </p>
                ) : null}
                {pickupLines.length > 0 ? (
                  <p className="text-xs font-semibold text-gray-600 mt-2">
                    Pickup address
                    {pickupFromProduct ? (
                      <span className="ml-1 font-normal text-gray-500">(from product)</span>
                    ) : null}
                  </p>
                ) : null}
                {pinLines.length > 0 ? (
                  <div className={`flex gap-2 text-gray-700 ${pickupLines.length > 0 ? 'mt-1' : 'mt-2'}`}>
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      {pinLines.map((line, j) => (
                        <p key={j}>{line}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
                {pickupLines.length > 0 && registeredLines.length > 0 ? (
                  <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-600">
                    <p className="font-semibold text-gray-700 mb-1">Registered business address</p>
                    <div className="leading-relaxed">
                      {registeredLines.map((line, j) => (
                        <p key={j}>{line}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
