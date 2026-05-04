import AdminShell from '@/components/AdminShell';
import UserManagement from '@/features/users/components/UserManagement';

export default function UsersPage() {
  return (
    <AdminShell>
      <UserManagement />
    </AdminShell>
  );
}
