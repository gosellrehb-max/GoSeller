'use client';

import type { CheckoutShippingAddress } from '@/services/api';

export type FormState = CheckoutShippingAddress;

export const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: { street: '', city: '', state: '', zipCode: '', country: '' },
};

export const VERIFY_MESSAGES = [
  'Connecting securely…',
  'Verifying with payment network…',
  'Authorizing transaction…',
];

export function digitsOnly(s: string) {
  return s.replace(/\D/g, '');
}
