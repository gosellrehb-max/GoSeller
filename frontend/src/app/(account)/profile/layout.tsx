import { RequireAuth } from '@/features/auth/components/RequireAuth';
import { LOGIN_PATH } from '@/features/auth/config/protectedRoutes';

export default function AccountProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth loginHref={LOGIN_PATH.customer}>{children}</RequireAuth>;
}
