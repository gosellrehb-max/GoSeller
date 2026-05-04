'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import GoSellerLogo from '@/components/ui/GoSellerLogo'

const OTP_LEN = 6

function OtpDigitRow({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const code = value.replace(/\D/g, '').slice(0, OTP_LEN)

  const update = (next: string) => {
    onChange(next.replace(/\D/g, '').slice(0, OTP_LEN))
  }

  const handleChange = (index: number, raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '')
    if (digitsOnly.length > 1) {
      update(digitsOnly.slice(0, OTP_LEN))
      const last = Math.min(digitsOnly.length, OTP_LEN) - 1
      refs.current[Math.max(0, last)]?.focus()
      return
    }
    if (!digitsOnly) {
      update(code.slice(0, index) + code.slice(index + 1))
      return
    }
    const ch = digitsOnly[digitsOnly.length - 1]
    const merged = (code.slice(0, index) + ch + code.slice(index + 1)).slice(0, OTP_LEN)
    update(merged)
    if (index < OTP_LEN - 1) refs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN)
    update(pasted)
    const idx = Math.min(Math.max(pasted.length - 1, 0), OTP_LEN - 1)
    refs.current[idx]?.focus()
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length: OTP_LEN }, (_, i) => (
        <input
          key={i}
          ref={(r) => {
            refs.current[i] = r
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={code[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          aria-label={`Digit ${i + 1} of ${OTP_LEN}`}
          className="w-9 h-11 sm:w-10 sm:h-12 text-center text-base sm:text-lg font-bold text-neutral-900 border border-neutral-300 rounded-md bg-white shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-shadow"
        />
      ))}
    </div>
  )
}

export type VerifyAccountOtpProps = {
  email: string
  value: string
  onChange: (code: string) => void
  onSubmit: (e: React.FormEvent) => void
  onResend: () => void
  isSubmitting?: boolean
  /** Resend in progress — do not use for main Continue button (OTP submit). */
  isResending?: boolean
  /** Shown briefly after resend API succeeds (e.g. “Code sent”). */
  resendSuccess?: boolean
  error?: string | null
  lastCodeSentAt?: number | null
  onBack?: () => void
  submitLabel?: string
  loadingSubmitLabel?: string
  showFooter?: boolean
  className?: string
  /** When adding a role to an existing account, collect password on this screen only (not during earlier steps). */
  accountPassword?: {
    value: string
    onChange: (v: string) => void
    show: boolean
    error?: string | null
  }
}

/**
 * Walmart-style verify screen: centered logo, headline, 6 digit boxes, pill CTA (primary green).
 */
export function VerifyAccountOtp({
  email,
  value,
  onChange,
  onSubmit,
  onResend,
  isSubmitting = false,
  isResending = false,
  resendSuccess = false,
  error,
  lastCodeSentAt,
  onBack,
  submitLabel = 'Continue',
  loadingSubmitLabel = 'Verifying…',
  showFooter = true,
  className = '',
  accountPassword,
}: VerifyAccountOtpProps) {
  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-wm-muted hover:text-primary mb-8 font-medium"
        >
          ← Back
        </button>
      ) : null}

      <div className="flex justify-center mb-8">
        <GoSellerLogo className="h-8 w-auto max-w-[180px]" />
      </div>

      <h1 className="text-center text-lg sm:text-xl font-bold text-neutral-900 tracking-tight mb-3">
        Verify your account
      </h1>

      <p className="text-center text-xs sm:text-sm text-neutral-700 leading-snug mb-8 px-1">
        For your security, you&apos;ll need to confirm it&apos;s you by entering a verification code we sent to{' '}
        <strong className="font-semibold text-neutral-900">{email}</strong>.
      </p>

      {error ? (
        <div className="mb-5 rounded-md bg-red-50 border border-red-100 text-red-800 px-4 py-2.5 text-xs text-center">
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6">
        <OtpDigitRow value={value} onChange={onChange} />

        {accountPassword?.show ? (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-800 text-left">
              Account password
            </label>
            <p className="text-left text-xs text-neutral-500">
              Enter the password you use to sign in to your existing account (not a new password).
            </p>
            <input
              type="password"
              autoComplete="current-password"
              value={accountPassword.value}
              onChange={(e) => accountPassword.onChange(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none ${
                accountPassword.error ? 'border-red-400' : 'border-neutral-300'
              }`}
              placeholder="Your existing password"
            />
            {accountPassword.error ? (
              <p className="text-left text-sm text-red-600">{accountPassword.error}</p>
            ) : null}
          </div>
        ) : null}

        <p className="text-center text-xs text-neutral-600">
          Didn&apos;t receive it?{' '}
          <button
            type="button"
            onClick={() => onResend()}
            disabled={isSubmitting || isResending}
            className="font-medium text-neutral-900 underline underline-offset-2 hover:text-primary disabled:opacity-50"
          >
            {isResending ? 'Sending code…' : 'Get another code'}
          </button>
          {resendSuccess && !isResending ? (
            <span className="ml-2 font-semibold text-emerald-600" role="status">
              Code sent
            </span>
          ) : null}
        </p>

        {lastCodeSentAt ? (
          <p className="text-center text-xs text-neutral-400">Last code sent {new Date(lastCodeSentAt).toLocaleTimeString()}.</p>
        ) : null}

        <button
          type="submit"
          disabled={
            isSubmitting ||
            value.replace(/\D/g, '').length < OTP_LEN ||
            Boolean(accountPassword?.show && !accountPassword.value.trim())
          }
          className="w-full rounded-full bg-primary py-2.5 sm:py-3 text-sm font-bold text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {loadingSubmitLabel}
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </form>

      {showFooter ? (
        <footer className="mt-16 pt-8 border-t border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-[11px] sm:text-xs text-neutral-500">
            <p>© {new Date().getFullYear()} GoSellr. All rights reserved.</p>
            <nav className="flex flex-wrap justify-center sm:justify-end gap-x-4 gap-y-1">
              <Link href="/privacy" className="hover:text-primary">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-primary">
                Terms of use
              </Link>
              <Link href="/login/customer" className="hover:text-primary">
                Help
              </Link>
            </nav>
          </div>
        </footer>
      ) : null}
    </div>
  )
}

export { OTP_LEN }
