'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '@/services/api';
import { getApiErrorMessage } from '@/utils/apiError';
import { VerifyAccountOtp } from '@/features/auth/components/VerifyAccountOtp';
import {
  AuthAccountShell,
  AuthAccountHeader,
  AuthLegalFooter,
} from '@/features/auth/components/AuthAccountShell';
import {
  authInputClass,
  authInputErrorClass,
  authLabelClass,
  authPrimaryButtonClass,
  authSecondaryLinkClass,
} from '@/features/auth/components/authFieldClasses';

const DEFAULT_RETURN = '/login/customer';

function safeReturnPath(raw: string | null): string {
  if (!raw || typeof raw !== 'string') return DEFAULT_RETURN;
  const t = raw.trim();
  if (!t.startsWith('/') || t.startsWith('//')) return DEFAULT_RETURN;
  return t;
}

const isPasswordStrong = (value: string) => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);

type Phase = 'email' | 'verify' | 'newPassword' | 'done';

export default function ForgotPasswordView() {
  const searchParams = useSearchParams();
  const returnTo = useMemo(() => safeReturnPath(searchParams.get('returnTo')), [searchParams]);

  const [phase, setPhase] = useState<Phase>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCodeSentAt, setLastCodeSentAt] = useState<number | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await authAPI.sendForgotPasswordCode(trimmed);
      setEmail(trimmed);
      setLastCodeSentAt(Date.now());
      setPhase('verify');
      toast.success(result.message || 'Check your email for a code.');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Could not send a code right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await authAPI.sendForgotPasswordCode(email);
      setLastCodeSentAt(Date.now());
      toast.success(result.message || 'Code sent.');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Could not resend the code.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPasswordStep = (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.replace(/\D/g, '');
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code from your email.');
      return;
    }
    setPhase('newPassword');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = verificationCode.replace(/\D/g, '');
    if (code.length !== 6) {
      toast.error('Enter the 6-digit verification code.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }
    if (!isPasswordStrong(newPassword)) {
      setFieldErrors({
        newPassword: 'Use at least 8 characters with one uppercase letter and one number.',
      });
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const result = await authAPI.resetPasswordWithCode({
        email,
        verificationCode: code,
        newPassword,
      });
      toast.success(result.message || 'Password updated.');
      setPhase('done');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not reset your password. Check the code and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (phase === 'done') {
    return (
      <AuthAccountShell layout="fullPage" contentMaxWidthClass="max-w-lg">
        <AuthAccountHeader
          roleBadge="Account security"
          title="Password updated"
          subtitle="You can sign in with your new password."
        />
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 mb-6">
          Your password was changed successfully.
        </div>
        <Link href={returnTo} className={`${authPrimaryButtonClass} block text-center`}>
          Back to sign in
        </Link>
        <AuthLegalFooter />
      </AuthAccountShell>
    );
  }

  if (phase === 'verify') {
    return (
      <AuthAccountShell layout="fullPage" contentMaxWidthClass="max-w-lg">
        <VerifyAccountOtp
          email={email}
          value={verificationCode}
          onChange={setVerificationCode}
          onSubmit={goToPasswordStep}
          onResend={handleResendCode}
          isSubmitting={isSubmitting}
          error={error}
          lastCodeSentAt={lastCodeSentAt}
          onBack={() => {
            setPhase('email');
            setError(null);
            setVerificationCode('');
          }}
          submitLabel="Continue"
          showFooter={false}
        />
        <div className="mt-8 pt-6 border-t border-wm-border">
          <AuthLegalFooter />
        </div>
      </AuthAccountShell>
    );
  }

  if (phase === 'newPassword') {
    return (
      <AuthAccountShell layout="fullPage" contentMaxWidthClass="max-w-lg">
        <AuthAccountHeader
          roleBadge="Account security"
          title="Create a new password"
          subtitle={`For ${email}`}
        />
        {error ? (
          <div className="mb-4 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        ) : null}
        <form onSubmit={handleResetPassword} className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setPhase('verify');
              setError(null);
            }}
            className="text-sm text-wm-link font-medium hover:underline self-start mb-2"
          >
            ← Back to verification code
          </button>
          <div>
            <label className={authLabelClass}>New password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="8+ characters, 1 uppercase, 1 number"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setFieldErrors((p) => ({ ...p, newPassword: '' }));
                }}
                className={`${authInputClass} pr-11 ${fieldErrors.newPassword ? authInputErrorClass : ''}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-wm-muted hover:text-wm-ink"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {fieldErrors.newPassword ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.newPassword}</p>
            ) : null}
          </div>
          <div>
            <label className={authLabelClass}>Confirm new password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFieldErrors((p) => ({ ...p, confirmPassword: '' }));
                }}
                className={`${authInputClass} pr-11 ${fieldErrors.confirmPassword ? authInputErrorClass : ''}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-wm-muted hover:text-wm-ink"
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {fieldErrors.confirmPassword ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
            ) : null}
          </div>
          <button type="submit" disabled={isSubmitting} className={`${authPrimaryButtonClass} w-full mt-2`}>
            {isSubmitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-wm-muted">
          <Link href={returnTo} className={authSecondaryLinkClass}>
            Cancel and sign in
          </Link>
        </p>
        <AuthLegalFooter />
      </AuthAccountShell>
    );
  }

  return (
    <AuthAccountShell layout="fullPage" contentMaxWidthClass="max-w-lg">
      <AuthAccountHeader
        roleBadge="Account security"
        title="Forgot password"
        subtitle="Enter your email and we’ll send a verification code. Then you can choose a new password."
      />
      <form onSubmit={handleSendCode} className="space-y-4">
        <div>
          <label className={authLabelClass} htmlFor="fp-email">
            Email address
          </label>
          <input
            id="fp-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
            required
          />
        </div>
        <button type="submit" disabled={isSubmitting} className={`${authPrimaryButtonClass} w-full`}>
          {isSubmitting ? 'Sending…' : 'Send verification code'}
        </button>
      </form>
      <p className="text-center mt-6 text-sm text-wm-muted">
        Remember your password?{' '}
        <Link href={returnTo} className={authSecondaryLinkClass}>
          Sign in
        </Link>
      </p>
      <AuthLegalFooter />
    </AuthAccountShell>
  );
}

