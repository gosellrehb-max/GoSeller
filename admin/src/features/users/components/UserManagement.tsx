'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { usersApi, type AdminUser } from '@/features/users/services/usersApi';

const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'customer', label: 'Customer' },
  { value: 'seller', label: 'Seller' },
  { value: 'rider', label: 'Rider' },
  { value: 'admin', label: 'Admin' },
  { value: 'super-admin', label: 'Super-admin' },
];

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  inactive: 'bg-slate-100 text-slate-500 ring-slate-400/20',
  suspended: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-blue-50 text-blue-700',
  'super-admin': 'bg-purple-50 text-purple-700',
  seller: 'bg-teal-50 text-teal-700',
  rider: 'bg-orange-50 text-orange-700',
  customer: 'bg-slate-100 text-slate-600',
};

type CreateAdminForm = { name: string; email: string; password: string };

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateAdminForm>({ name: '', email: '', password: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await usersApi.list({ page, limit: 15, search: search || undefined, userType: roleFilter || undefined });
      setUsers(result.users);
      setPagination(result.pagination);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { void load(); }, [load]);

  // Debounce search
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const handleStatusChange = async (user: AdminUser, status: 'active' | 'inactive' | 'suspended') => {
    setBusyId(user._id);
    try {
      const updated = await usersApi.updateStatus(user._id, status);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, status: updated.status } : u)));
      toast.success(`Account ${status}.`);
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setBusyId(null);
    }
  };

  const handlePromote = async (user: AdminUser) => {
    if (!window.confirm(`Promote ${user.firstName} ${user.lastName} to Admin?`)) return;
    setBusyId(user._id);
    try {
      const updated = await usersApi.promoteToAdmin(user._id);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, roles: updated.roles, role: updated.role } : u)));
      toast.success('User promoted to Admin.');
    } catch {
      toast.error('Failed to promote user.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('All fields are required.');
      return;
    }
    setCreating(true);
    try {
      await usersApi.createAdmin(form);
      toast.success(`Admin account created for ${form.email}.`);
      setForm({ name: '', email: '', password: '' });
      setShowCreate(false);
      void load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to create admin.');
    } finally {
      setCreating(false);
    }
  };

  const isAdmin = (u: AdminUser) => u.roles?.includes('admin') || u.roles?.includes('super-admin') || u.role === 'admin' || u.role === 'super-admin';
  const displayRoles = (u: AdminUser) => Array.from(new Set([u.role, ...(u.roles ?? [])])).filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Users</h2>
          <p className="text-sm text-slate-500">
            {pagination.total} total accounts — search, filter, change roles &amp; status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Admin
        </button>
      </div>

      {/* Create Admin Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Create Admin Account</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mb-5 text-sm text-slate-500">
              The account will be created with <strong>Admin</strong> role and <strong>Active</strong> status immediately.
              Password must be 8+ chars, with at least one uppercase letter and one number.
            </p>
            <form onSubmit={(e) => void handleCreateAdmin(e)} className="space-y-3">
              <input
                type="text"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <input
                type="password"
                placeholder="Password (e.g. Admin@1234)"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {creating ? 'Creating…' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
        >
          {ROLE_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">User</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Roles</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">No users found.</td></tr>
              ) : users.map((user) => {
                const busy = busyId === user._id;
                const initial = (user.firstName?.charAt(0) || user.email?.charAt(0) || '?').toUpperCase();
                const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || '—';
                const roles = displayRoles(user);
                return (
                  <tr key={user._id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{name}</p>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {roles.map((r) => (
                          <span key={r} className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[r] ?? 'bg-slate-100 text-slate-600'}`}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE[user.status] ?? 'bg-slate-100 text-slate-500 ring-slate-400/20'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5 flex-wrap">
                        {user.status !== 'active' && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleStatusChange(user, 'active')}
                            className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Activate
                          </button>
                        )}
                        {user.status === 'active' && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleStatusChange(user, 'suspended')}
                            className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        )}
                        {!isAdmin(user) && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handlePromote(user)}
                            className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            Make Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">
              Page {pagination.current} of {pagination.pages} · {pagination.total} users
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
