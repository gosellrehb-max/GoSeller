'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Mail, X } from 'lucide-react';
import GoSellerLogo from '@/components/ui/GoSellerLogo';

export type RegistrationSuccessRow = { term: string; value: string };

export type RegistrationSuccessPanelProps = {
  eyebrow: string;
  description: string;
  rows: RegistrationSuccessRow[];
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  userEmail: string;
};

export function RegistrationSuccessPanel({
  eyebrow,
  description,
  rows,
  primaryLabel,
  primaryHref,
  secondaryLabel = 'Sign in',
  secondaryHref,
  userEmail,
}: RegistrationSuccessPanelProps) {
  const visibleRows = rows.filter((r) => r.value?.trim());

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <GoSellerLogo className="h-8 w-auto" />
        </Link>
        <Link href="/" className="rounded-md p-1 text-wm-muted hover:text-wm-ink" aria-label="Close">
          <X size={22} />
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg"
      >
        <div className="overflow-hidden rounded-lg border border-wm-border bg-white shadow-wm">
          <div className="h-1 bg-primary" aria-hidden />
          <div className="px-6 pb-8 pt-9 sm:px-8">
            <div className="mb-8 flex flex-col items-center text-center">
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary-50 text-primary"
                aria-hidden
              >
                <Check className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-wm-muted">{eyebrow}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-wm-ink sm:text-[1.65rem]">
                You&apos;re all set
              </h1>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-wm-muted">{description}</p>
            </div>

            {visibleRows.length > 0 ? (
              <div className="mb-8 border-y border-wm-border py-1">
                <dl className="divide-y divide-wm-border text-sm">
                  {visibleRows.map((row) => (
                    <div key={row.term} className="flex justify-between gap-4 py-3">
                      <dt className="shrink-0 text-wm-muted">{row.term}</dt>
                      <dd className="break-words text-right font-medium text-wm-ink">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-row-reverse sm:gap-3">
              <Link
                href={primaryHref}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:flex-1"
              >
                {primaryLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              {secondaryHref ? (
                <Link
                  href={secondaryHref}
                  className="inline-flex w-full items-center justify-center rounded-md border border-wm-border bg-white px-4 py-2.5 text-sm font-medium text-wm-ink shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 sm:flex-1"
                >
                  {secondaryLabel}
                </Link>
              ) : null}
            </div>

            <div className="mt-8 flex gap-3 border-t border-wm-border pt-6 text-left">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-wm-muted" aria-hidden />
              <p className="text-xs leading-relaxed text-wm-muted">
                We sent a message to <span className="font-medium text-wm-ink">{userEmail}</span> with next steps. If you
                don&apos;t see it, check spam or promotions.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
