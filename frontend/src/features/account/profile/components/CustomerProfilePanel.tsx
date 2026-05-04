'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { CustomerUser } from '@/features/account/profile/types/profileTypes';

export default function CustomerProfilePanel({ user }: { user: CustomerUser }) {
  const { updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(user.firstName ?? '');
  const [lastName, setLastName] = useState(user.lastName ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [saving, setSaving] = useState(false);

  const isDirty =
    firstName.trim() !== (user.firstName ?? '').trim() ||
    lastName.trim() !== (user.lastName ?? '').trim() ||
    phone.trim() !== (user.phone ?? '').trim();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error('First name is required.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() || undefined });
      toast.success('Profile updated successfully.');
    } catch {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20';

  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-5">
        <User className="w-4 h-4" /> Account info
      </h2>
      <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              First name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Last name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
          <input
            type="email"
            value={user.email}
            readOnly
            className="w-full rounded-lg border border-gray-100 bg-gray-100 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
          />
          <p className="mt-1 text-[11px] text-gray-400">Email cannot be changed.</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 000 0000"
            className={inputCls}
          />
        </div>
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : null}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
