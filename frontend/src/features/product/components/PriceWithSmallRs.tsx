'use client';

import React from 'react';

type PriceSize = 'shelf' | 'pdp';

/**
 * Buyer UI: PKR + amount.
 * - **shelf** (default): small PKR top-left, main price beside it (home / cards).
 * - **pdp**: PKR same size/weight as the main digits (product detail only).
 */
export function PriceWithSmallRs({
  dollars,
  cents,
  toneClassName,
  size = 'shelf',
}: {
  dollars: string;
  cents: string;
  toneClassName: string;
  size?: PriceSize;
}) {
  const main =
    size === 'pdp'
      ? 'text-4xl font-bold tracking-tight'
      : 'text-xl font-bold tracking-tight';
  const cent =
    size === 'pdp' ? 'text-lg font-bold' : 'text-xs font-bold';

  if (size === 'pdp') {
    return (
      <span
        className={`inline-flex items-baseline gap-x-1 leading-none ${toneClassName}`}
      >
        <span className={main}>PKR</span>
        <span className="inline-flex items-baseline">
          <span className={main}>{dollars}</span>
          {cents !== '00' && (
            <span className={cent} style={{ verticalAlign: 'super' }}>
              {cents}
            </span>
          )}
        </span>
      </span>
    );
  }

  /** Shelf / home: compact PKR anchored top-left */
  const prefixClass = 'text-[11px] font-bold leading-none';
  const prefixGutter = 'pl-[1.65rem]';

  return (
    <span className={`relative inline-block ${prefixGutter} ${toneClassName}`}>
      <span className={`absolute left-0 top-0 ${prefixClass}`}>PKR</span>
      <span className="inline-flex items-baseline leading-none">
        <span className={main}>{dollars}</span>
        {cents !== '00' && (
          <span className={cent} style={{ verticalAlign: 'super' }}>
            {cents}
          </span>
        )}
      </span>
    </span>
  );
}

/** Strikethrough compare-at amount only (no currency prefix). */
export function StrikethroughPriceSmallRs({
  amountFixed,
  className,
  rsSizeClass: _rsSizeClass,
}: {
  amountFixed: string;
  className?: string;
  /** @deprecated Unused; kept so existing call sites stay valid */
  rsSizeClass?: string;
}) {
  return (
    <span
      className={`font-bold leading-none line-through ${className ?? 'text-wm-muted'}`}
    >
      {amountFixed}
    </span>
  );
}
