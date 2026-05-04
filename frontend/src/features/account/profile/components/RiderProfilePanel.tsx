'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Upload, CreditCard, Phone, MapPin, Truck, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRiderProfile } from '@/features/account/profile/hooks/useRiderProfile';

export default function RiderProfilePanel({ userName, userEmail }: { userName: string; userEmail: string }) {
  const { user: authUser, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(authUser?.firstName ?? userName.split(' ')[0] ?? '');
  const [lastName, setLastName] = useState(authUser?.lastName ?? userName.split(' ').slice(1).join(' ') ?? '');
  const [savingName, setSavingName] = useState(false);

  const handleSaveName = async () => {
    if (!firstName.trim()) { toast.error('First name is required.'); return; }
    setSavingName(true);
    try {
      await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
      toast.success('Name updated.');
    } catch {
      toast.error('Failed to update name.');
    } finally {
      setSavingName(false);
    }
  };

  const {
    profile,
    loading,
    saving,
    phone,
    address,
    idNumber,
    vehicleType,
    courierCompanyName,
    courierCompanyBranch,
    courierEmployeeId,
    personalNotes,
    idCardPreview,
    fileInputRef,
    setPhone,
    setAddress,
    setIdNumber,
    setVehicleType,
    setCourierCompanyName,
    setCourierCompanyBranch,
    setCourierEmployeeId,
    setPersonalNotes,
    handleFileChange,
    handleSave,
  } = useRiderProfile();

  const inputCls =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00B207]/40 focus:border-[#00B207] transition';
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

  if (loading) {
    return <p className="mt-10 text-center text-sm text-gray-500">Loading profile…</p>;
  }

  return (
    <form onSubmit={handleSave} className="mt-8 space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
          <User className="w-4 h-4" /> Account info
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>First name</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Last name</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className={inputCls} />
          </div>
          <div>
            <p className={labelCls}>Email</p>
            <p className="rounded-lg border border-gray-100 bg-gray-100 px-3 py-2.5 text-sm text-gray-500">{userEmail}</p>
          </div>
          {profile?.status ? (
            <div>
              <p className={labelCls}>Account status</p>
              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 capitalize">{profile.status}</span>
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSaveName()}
            disabled={savingName}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {savingName ? <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
            {savingName ? 'Saving…' : 'Save name'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
          <Phone className="w-4 h-4" /> Contact &amp; location
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Phone <span className="text-red-500">*</span></label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 0000000" className={inputCls} required />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address <span className="text-red-500">*</span></span>
            </label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full delivery / home address" rows={2} className={inputCls + ' resize-none'} required />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
          <CreditCard className="w-4 h-4" /> Identity &amp; vehicle
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>ID card number (CNIC) <span className="text-red-500">*</span></label>
            <input type="text" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="XXXXX-XXXXXXX-X" className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}><span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Vehicle type</span></label>
            <input type="text" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="e.g. Motorcycle, Van, Bicycle" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>ID card image (CNIC photo)</label>
            {(idCardPreview || profile?.idCardDocumentUrl) && (
              <div className="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                <Image src={idCardPreview ?? (profile?.idCardDocumentUrl as string)} alt="ID card" width={480} height={200} className="h-40 w-full object-contain" unoptimized />
                {idCardPreview ? (
                  <p className="px-3 py-1.5 text-xs text-amber-700 bg-amber-50 border-t border-amber-100">New image selected — click Save to upload</p>
                ) : null}
              </div>
            )}
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition w-full justify-center">
              <Upload className="w-4 h-4" />
              {profile?.idCardDocumentUrl ? 'Replace ID card image' : 'Upload ID card image'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Courier company (optional)</h2>
        <p className="text-xs text-gray-500 mb-4">Fill these in if you work for a courier company like TCS, Leopards, etc.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={labelCls}>Company name</label><input type="text" value={courierCompanyName} onChange={(e) => setCourierCompanyName(e.target.value)} placeholder="e.g. TCS, Leopards" className={inputCls} /></div>
          <div><label className={labelCls}>Branch</label><input type="text" value={courierCompanyBranch} onChange={(e) => setCourierCompanyBranch(e.target.value)} placeholder="Branch name or city" className={inputCls} /></div>
          <div><label className={labelCls}>Employee ID</label><input type="text" value={courierEmployeeId} onChange={(e) => setCourierEmployeeId(e.target.value)} placeholder="Your company employee ID" className={inputCls} /></div>
          <div className="sm:col-span-2"><label className={labelCls}>Personal notes</label><textarea value={personalNotes} onChange={(e) => setPersonalNotes(e.target.value)} placeholder="Any additional notes about yourself or your delivery preferences" rows={2} className={inputCls + ' resize-none'} /></div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <Link
          href="/rider"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
        >
          ← Back to dashboard
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
