'use client';

import React from 'react';
import { FiInfo, FiX } from 'react-icons/fi';

export function ProductFormHelpTrigger({
  expanded,
  onToggle,
  controlsId,
  srLabel,
}: {
  expanded: boolean;
  onToggle: () => void;
  controlsId?: string;
  srLabel: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      {...(controlsId ? { 'aria-controls': controlsId } : {})}
      onClick={onToggle}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        expanded
          ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
          : 'border-gray-200 bg-white text-gray-500 hover:border-emerald-200 hover:bg-emerald-50/80 hover:text-emerald-800'
      }`}
    >
      <span className="sr-only">{srLabel}</span>
      <span className="text-[11px] leading-none font-bold" aria-hidden>
        i
      </span>
    </button>
  );
}

export function ProductFormHelpPanel({
  side,
  panelId,
  titleId,
  cardTitle,
  onClose,
  closeLabel = 'Close tips',
  className = '',
  children,
}: {
  side: 'left' | 'right';
  panelId: string;
  titleId: string;
  cardTitle: string;
  onClose: () => void;
  closeLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const pointer =
    side === 'left' ? (
      <div className="pointer-events-none absolute -right-[14px] top-8 z-[2] hidden lg:block" aria-hidden>
        <div className="h-6 w-3 bg-emerald-100 [clip-path:polygon(0_0,100%_50%,0_100%)]" />
        <div className="absolute left-[-1px] top-[1px] h-[22px] w-[11px] bg-emerald-50 [clip-path:polygon(0_0,100%_50%,0_100%)]" />
      </div>
    ) : (
      <div className="pointer-events-none absolute -left-[14px] top-8 z-[2] hidden lg:block" aria-hidden>
        <div className="h-6 w-3 bg-emerald-100 [clip-path:polygon(100%_0,0_50%,100%_100%)]" />
        <div className="absolute right-[-1px] top-[1px] h-[22px] w-[11px] bg-emerald-50 [clip-path:polygon(100%_0,0_50%,100%_100%)]" />
      </div>
    );

  return (
    <aside
      id={panelId}
      role="note"
      className={`relative w-full xl:w-[min(100%,248px)] xl:shrink-0 ${className}`.trim()}
      aria-labelledby={titleId}
    >
      <div className="relative overflow-visible rounded-xl border border-emerald-100 bg-emerald-50 px-3 pb-3 pt-6 shadow-sm shadow-emerald-900/5">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white/80 hover:text-gray-800"
          aria-label={closeLabel}
        >
          <FiX className="h-3.5 w-3.5" />
        </button>
        <div className="pointer-events-none absolute left-1/2 top-0 z-[1] -translate-x-1/2 -translate-y-1/2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#0d9488] text-white shadow-sm ring-2 ring-emerald-100">
            <FiInfo className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          </span>
        </div>
        <h4 id={titleId} className="text-center text-[13px] font-semibold tracking-tight text-gray-900">
          {cardTitle}
        </h4>
        <div className="mt-2 text-center text-[11px] leading-relaxed text-gray-600">{children}</div>
        {pointer}
      </div>
    </aside>
  );
}
