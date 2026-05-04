'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ridersAPI } from '@/services/api';
import { riderProfileQueryKeys } from '@/features/account/profile/hooks/queryKeys';
import type { RiderProfile } from '@/features/account/profile/types/profileTypes';
import { normalizeRiderProfileForClient } from '@/features/account/profile/utils/normalizeRiderProfileFields';

export function useRiderProfile() {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [courierCompanyName, setCourierCompanyName] = useState('');
  const [courierCompanyBranch, setCourierCompanyBranch] = useState('');
  const [courierEmployeeId, setCourierEmployeeId] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: profileData,
    isLoading: loading,
    isError: profileLoadError,
  } = useQuery({
    queryKey: riderProfileQueryKeys.profile,
    queryFn: async () => {
      const { rider } = await ridersAPI.getMe();
      return rider as RiderProfile & { idCardDocumentUrl?: string };
    },
  });

  useEffect(() => {
    if (!profileData) return;
    const normalized = normalizeRiderProfileForClient(
      profileData as RiderProfile & { idCardDocumentUrl?: string },
    );
    setProfile(normalized);
    setPhone(normalized.phone);
    setAddress(normalized.address);
    setIdNumber(normalized.idNumber);
    setVehicleType(normalized.vehicleType ?? '');
    setCourierCompanyName(normalized.courierCompanyName ?? '');
    setCourierCompanyBranch(normalized.courierCompanyBranch ?? '');
    setCourierEmployeeId(normalized.courierEmployeeId ?? '');
    setPersonalNotes(normalized.personalNotes ?? '');
  }, [profileData]);

  useEffect(() => {
    if (profileLoadError) toast.error('Could not load rider profile');
  }, [profileLoadError]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { rider } = await ridersAPI.updateMe({
        phone: phone.trim(),
        address: address.trim(),
        idNumber: idNumber.trim(),
        vehicleType: vehicleType.trim() || undefined,
        personalNotes: personalNotes.trim() || undefined,
        courierCompanyName: courierCompanyName.trim() || undefined,
        courierCompanyBranch: courierCompanyBranch.trim() || undefined,
        courierEmployeeId: courierEmployeeId.trim() || undefined,
        idCardFile: idCardFile ?? undefined,
      });
      return rider as RiderProfile;
    },
    onSuccess: async (updated) => {
      const normalized = normalizeRiderProfileForClient(
        updated as RiderProfile & { idCardDocumentUrl?: string },
      );
      setProfile(normalized);
      setPhone(normalized.phone);
      setAddress(normalized.address);
      setIdNumber(normalized.idNumber);
      setVehicleType(normalized.vehicleType ?? '');
      setCourierCompanyName(normalized.courierCompanyName ?? '');
      setCourierCompanyBranch(normalized.courierCompanyBranch ?? '');
      setCourierEmployeeId(normalized.courierEmployeeId ?? '');
      setPersonalNotes(normalized.personalNotes ?? '');
      setIdCardFile(null);
      setIdCardPreview(null);
      toast.success('Profile updated successfully!');
      await queryClient.invalidateQueries({ queryKey: riderProfileQueryKeys.profile });
    },
    onError: (err: unknown) => {
      const e2 = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(e2?.response?.data?.message ?? e2?.message ?? 'Update failed');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setIdCardFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setIdCardPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setIdCardPreview(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !address.trim() || !idNumber.trim()) {
      toast.error('Phone, address and ID card number are required.');
      return;
    }
    await saveMutation.mutateAsync();
  };
  const saving = saveMutation.isPending;

  return {
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
    idCardFile,
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
  };
}
