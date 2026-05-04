'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { getApiErrorMessage } from '@/utils/apiError';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { AccountType } from '@/contexts/AuthContext';
import { VerifyAccountOtp } from '@/features/auth/components/VerifyAccountOtp';
import { AuthSignupStepper } from '@/features/auth/components/AuthSignupStepper';
import {
  AuthAccountShell,
  AuthAccountHeader,
  AuthLegalFooter,
} from '@/features/auth/components/AuthAccountShell';
import {
  authInputClass,
  authLabelClass,
  authPrimaryButtonClass,
  authSecondaryLinkClass,
} from '@/features/auth/components/authFieldClasses';
import { appendQueryParam, resolveAuthReturnUrl, withReturnUrl } from '@/features/auth/utils/returnUrl';

type AuthMode = 'login' | 'signup';

const roleMeta: Record<AccountType, { label: string; loginRedirect: string }> = {
  customer: { label: 'Customer', loginRedirect: '/' },
  seller: { label: 'Seller', loginRedirect: '/seller' },
  rider: { label: 'Rider', loginRedirect: '/rider' },
};

const legacySignup: Record<AccountType, string> = {
  customer: '/register/customer',
  seller: '/register/seller',
  rider: '/register/rider',
};

const legacyLogin: Record<AccountType, string> = {
  customer: '/login/customer',
  seller: '/login/seller',
  rider: '/login/rider',
};

export default function AuthForm({ role, mode }: { role: AccountType; mode: AuthMode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { loginMutation, register, sendRegistrationCode } = useAuth();
  const isCustomerSignup = mode === 'signup' && role === 'customer';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSentAt, setCodeSentAt] = useState<number | null>(null);
  const [signupStep, setSignupStep] = useState<'details' | 'verify'>('details');

  const title = useMemo(
    () => (mode === 'login' ? `Sign in as ${roleMeta[role].label}` : `Sign up as ${roleMeta[role].label}`),
    [mode, role],
  );
  const postLoginReturnUrl = useMemo(
    () => resolveAuthReturnUrl(searchParams, roleMeta[role].loginRedirect),
    [role, searchParams],
  );
  const forgotPasswordHref = useMemo(() => {
    const signInHref = withReturnUrl(pathname || legacyLogin[role], postLoginReturnUrl);
    return appendQueryParam('/forgot-password', 'returnTo', signInHref);
  }, [pathname, postLoginReturnUrl, role]);

  const sendCustomerCode = async () => {
    try {
      setError('');
      setIsSendingCode(true);
      await sendRegistrationCode({ email: email.trim(), accountType: 'customer' });
      setCodeSentAt(Date.now());
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to send verification code.'));
      throw err;
    } finally {
      setIsSendingCode(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'signup') {
      if (isCustomerSignup) {
        const namePattern = /^[A-Za-z\s]+$/;
        if (!namePattern.test(firstName.trim()) || !namePattern.test(lastName.trim())) {
          setError('First name and last name must contain letters only.');
          return;
        }
        if (signupStep === 'details') {
          if (!email.trim() || !password.trim()) {
            setError('Email and password are required.');
            return;
          }
          try {
            await sendCustomerCode();
            setSignupStep('verify');
          } catch {
            // `sendCustomerCode` already handles and shows error.
          }
          return;
        }

        if (!verificationCode.trim()) {
          setError('Verification code is required.');
          return;
        }
        try {
          setIsSubmitting(true);
          await register({
            email: email.trim(),
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role: 'customer',
            verificationCode: verificationCode.trim(),
          });
          router.replace(postLoginReturnUrl);
        } catch (err: unknown) {
          setError(getApiErrorMessage(err, 'Registration failed.'));
        } finally {
          setIsSubmitting(false);
        }
        return;
      }
      router.push(legacySignup[role]);
      return;
    }
    try {
      await loginMutation.mutateAsync({ email, password, role });
      router.replace(postLoginReturnUrl);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Authentication failed.'));
    }
  };

  return (
    <AuthAccountShell layout="fullPage">
      {isCustomerSignup && signupStep === 'verify' ? (
        <>
          <AuthSignupStepper
            steps={[
              { id: 'details', label: 'Details' },
              { id: 'verify', label: 'Verification' },
            ]}
            currentIndex={1}
          />
          <VerifyAccountOtp
            email={email}
            value={verificationCode}
            onChange={(v) => setVerificationCode(v)}
            onSubmit={onSubmit}
            onResend={sendCustomerCode}
            isSubmitting={isSubmitting}
            isResending={isSendingCode}
            resendSuccess={Boolean(codeSentAt && !isSendingCode)}
            lastCodeSentAt={codeSentAt}
            error={error || null}
            onBack={() => setSignupStep('details')}
            submitLabel="Complete registration"
            loadingSubmitLabel="Creating account…"
            showFooter={false}
          />
          <AuthLegalFooter />
        </>
      ) : (
        <>
      <AuthAccountHeader roleBadge={`${roleMeta[role].label} account`} title={title} subtitle="GoSellr authentication" />
      {(() => {
        const info = searchParams?.get('info');
        if (!info || mode !== 'signup') return null;
        const banners: Record<string, { heading: string; body: string }> = {
          seller: {
            heading: 'Becoming a seller?',
            body: 'Create a standard account first. Once logged in, open the account menu and choose "Switch to Seller" to activate your seller profile.',
          },
          rider: {
            heading: 'Joining as a delivery rider?',
            body: 'Create a standard account first. Once logged in, open the account menu and choose "Switch to Rider" to activate your rider profile.',
          },
        };
        const b = banners[info];
        if (!b) return null;
        return (
          <div className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <p className="font-semibold mb-0.5">{b.heading}</p>
            <p>{b.body}</p>
          </div>
        );
      })()}
      {error ? <div className="mb-4 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      <form onSubmit={onSubmit} className="space-y-4">
        {isCustomerSignup ? (
          <AuthSignupStepper
            steps={[
              { id: 'details', label: 'Details' },
              { id: 'verify', label: 'Verification' },
            ]}
            currentIndex={0}
          />
        ) : null}
        {isCustomerSignup ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={authLabelClass}>First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={authInputClass}
                placeholder="First name"
                required
              />
            </div>
            <div>
              <label className={authLabelClass}>Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={authInputClass}
                placeholder="Last name"
                required
              />
            </div>
          </div>
        ) : null}
        <div>
          <label className={authLabelClass}>Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className={authLabelClass}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${authInputClass} pr-11`}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-wm-muted hover:text-wm-ink"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        {mode === 'login' ? (
          <div className="text-right">
            <Link href={forgotPasswordHref} className="text-xs sm:text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
        ) : null}
        <button type="submit" className={authPrimaryButtonClass} disabled={loginMutation.isPending || isSubmitting}>
          {mode === 'login'
            ? (loginMutation.isPending ? 'Signing in…' : 'Sign in')
            : (isSendingCode ? 'Sending verification code…' : 'Continue to verification')}
        </button>
      </form>
      <p className="text-center mt-5 text-xs sm:text-sm text-wm-muted">
        {mode === 'login' ? 'Need an account? ' : 'Already have an account? '}
        <Link
          href={mode === 'login' ? withReturnUrl(`/register/${role}`, postLoginReturnUrl) : withReturnUrl(legacyLogin[role], postLoginReturnUrl)}
          className={authSecondaryLinkClass}
        >
          {mode === 'login' ? 'Create account' : 'Sign in'}
        </Link>
      </p>
      <AuthLegalFooter />
        </>
      )}
    </AuthAccountShell>
  );
}

