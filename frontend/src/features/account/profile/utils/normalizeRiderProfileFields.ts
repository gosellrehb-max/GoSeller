import type { RiderProfile } from '@/features/account/profile/types/profileTypes';

/** Matches backend `riders.service` draft placeholders — strip so UI shows empty inputs. */
export function normalizeRiderFieldFromApi(
  value: string | undefined,
  field: 'phone' | 'address' | 'id',
): string {
  const v = (value ?? '').trim();
  if (!v) return '';
  if (field === 'phone' && v === '0000000000') return '';
  if (
    field === 'address' &&
    v.toLowerCase() === 'please update your address in profile settings.'
  )
    return '';
  if (field === 'id' && /^pending$/i.test(v)) return '';
  return v;
}

/** Rider profile for React state / UI (no draft sentinels; hide status until profile is complete). */
export function normalizeRiderProfileForClient(
  data: RiderProfile & { idCardDocumentUrl?: string },
): RiderProfile {
  const phone = normalizeRiderFieldFromApi(data.phone, 'phone');
  const address = normalizeRiderFieldFromApi(data.address, 'address');
  const idNumber = normalizeRiderFieldFromApi(data.idNumber, 'id');
  const idCardDocumentUrl = data.idCardDocumentUrl;
  const idCard = (idCardDocumentUrl ?? '').trim();
  const complete = Boolean(phone && address && idNumber && idCard);

  const next: RiderProfile = {
    phone,
    address,
    idNumber,
    vehicleType: data.vehicleType ?? '',
    courierCompanyName: data.courierCompanyName ?? '',
    courierCompanyBranch: data.courierCompanyBranch ?? '',
    courierEmployeeId: data.courierEmployeeId ?? '',
    personalNotes: data.personalNotes ?? '',
    idCardDocumentUrl,
  };
  if (complete && data.status) next.status = data.status;
  return next;
}
