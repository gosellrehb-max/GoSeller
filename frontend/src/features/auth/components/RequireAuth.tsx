'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { withReturnUrl } from '@/features/auth/utils/returnUrl';

/**
 * Route-segment guard: redirect guests to `loginHref` with `returnUrl` after auth hydration.
 */
export function RequireAuth({
  loginHref,
  children,
}: {
  loginHref: string;
  children: ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(withReturnUrl(loginHref, pathname));
    }
  }, [isAuthenticated, isLoading, loginHref, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="mt-3 text-sm text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
