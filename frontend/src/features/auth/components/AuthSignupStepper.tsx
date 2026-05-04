'use client';

import React from 'react';

export type AuthStepDef = {
  id: string;
  label: string;
};

type AuthSignupStepperProps = {
  steps: AuthStepDef[];
  currentIndex: number;
  className?: string;
};

/**
 * Horizontal step indicator (Walmart-style: numbered circles + labels + progress bar).
 */
export function AuthSignupStepper({ steps, currentIndex, className = '' }: AuthSignupStepperProps) {
  return (
    <nav aria-label="Sign-up progress" className={`mb-6 ${className}`}>
      <ol className="flex items-start justify-between gap-2 sm:gap-4">
        {steps.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={step.id} className="flex flex-1 flex-col items-center min-w-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  done
                    ? 'bg-primary text-white'
                    : active
                      ? 'bg-primary text-white ring-2 ring-primary/30 ring-offset-2'
                      : 'bg-wm-border text-wm-muted'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                className={`mt-1.5 text-center text-[10px] sm:text-[11px] font-medium leading-tight ${
                  active ? 'text-wm-ink' : 'text-wm-muted'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 h-1 w-full rounded-full bg-wm-border overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
        />
      </div>
    </nav>
  );
}
