'use client';

export type RiderProfile = {
  phone: string;
  address: string;
  idNumber: string;
  vehicleType: string;
  courierCompanyName: string;
  courierCompanyBranch: string;
  courierEmployeeId: string;
  personalNotes: string;
  idCardDocumentUrl?: string;
  status?: string;
};

export type CustomerUser = {
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
};
