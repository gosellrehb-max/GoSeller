import { RequireAuth } from '@/features/auth/components/RequireAuth';
import { LOGIN_PATH } from '@/features/auth/config/protectedRoutes';

export default function ProductManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth loginHref={LOGIN_PATH.seller}>{children}</RequireAuth>;
}
