import { api } from "../http/client";
import type { AuthUser } from "./auth";
import type { ApiOrder } from "./orders";

export type RiderRegisterPayload = {
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  verificationCode: string;
  phone?: string;
  address?: string;
  idNumber?: string;
  idCardFile?: File | null;
  personalNotes?: string;
  courierCompanyName?: string;
  courierCompanyBranch?: string;
  courierEmployeeId?: string;
  vehicleType?: string;
  courierCompanyDetails?: string;
};

/** Rider profile document from API (fields vary). */
export type ApiRider = Record<string, unknown>;

export const ridersAPI = {
  checkRegistrationEmail: async (
    email: string,
  ): Promise<{
    email: string;
    canRegister: boolean;
    existingAccountWithoutRole: boolean;
    existingRoles?: string[];
    message: string;
  }> => {
    const response = await api.post("/riders/register/check-email", { email });
    return response.data?.data ?? response.data;
  },

  sendRegistrationCode: async (
    email: string,
  ): Promise<{
    email: string;
    role: string;
    expiresAt: string;
    sent: boolean;
    message: string;
    existingAccountWithoutRole?: boolean;
  }> => {
    const response = await api.post("/riders/register/send-code", { email });
    return response.data?.data ?? response.data;
  },

  register: async (
    data: RiderRegisterPayload,
  ): Promise<{
    rider: ApiRider;
    user: AuthUser;
    token: string;
    message?: string;
  }> => {
    const fd = new FormData();
    fd.append("email", data.email);
    fd.append("verificationCode", data.verificationCode);
    fd.append("firstName", data.firstName ?? "");
    fd.append("lastName", data.lastName ?? "");
    if (data.password) fd.append("password", data.password);
    fd.append("phone", data.phone ?? "");
    fd.append("address", data.address ?? "");
    fd.append("idNumber", data.idNumber ?? "");
    if (data.idCardFile) fd.append("idCard", data.idCardFile);
    if (data.personalNotes) fd.append("personalNotes", data.personalNotes);
    if (data.courierCompanyName)
      fd.append("courierCompanyName", data.courierCompanyName);
    if (data.courierCompanyBranch)
      fd.append("courierCompanyBranch", data.courierCompanyBranch);
    if (data.courierEmployeeId)
      fd.append("courierEmployeeId", data.courierEmployeeId);
    if (data.vehicleType) fd.append("vehicleType", data.vehicleType);
    if (data.courierCompanyDetails)
      fd.append("courierCompanyDetails", data.courierCompanyDetails);
    const response = await api.post("/riders/register", fd);
    const payload = response.data?.data ?? response.data;
    return payload as {
      rider: ApiRider;
      user: AuthUser;
      token: string;
      message?: string;
    };
  },

  getMe: async (): Promise<{ rider: ApiRider }> => {
    const response = await api.get("/riders/me");
    const payload = response.data?.data ?? response.data;
    return payload as { rider: ApiRider };
  },

  updateMe: async (data: {
    address?: string;
    phone?: string;
    idNumber?: string;
    idCardFile?: File | null;
    vehicleType?: string;
    personalNotes?: string;
    courierCompanyName?: string;
    courierCompanyBranch?: string;
    courierEmployeeId?: string;
  }): Promise<{ rider: ApiRider }> => {
    const fd = new FormData();
    if (data.address !== undefined) fd.append("address", data.address);
    if (data.phone !== undefined) fd.append("phone", data.phone);
    if (data.idNumber !== undefined) fd.append("idNumber", data.idNumber);
    if (data.vehicleType !== undefined)
      fd.append("vehicleType", data.vehicleType);
    if (data.personalNotes !== undefined)
      fd.append("personalNotes", data.personalNotes);
    if (data.courierCompanyName !== undefined)
      fd.append("courierCompanyName", data.courierCompanyName);
    if (data.courierCompanyBranch !== undefined)
      fd.append("courierCompanyBranch", data.courierCompanyBranch);
    if (data.courierEmployeeId !== undefined)
      fd.append("courierEmployeeId", data.courierEmployeeId);
    if (data.idCardFile) fd.append("idCard", data.idCardFile);
    const response = await api.put("/riders/me", fd);
    const payload = response.data?.data ?? response.data;
    return payload as { rider: ApiRider };
  },

  getAvailableOrders: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ orders: ApiOrder[]; pagination: Record<string, unknown> }> => {
    const response = await api.get("/riders/orders/available", { params });
    const payload = response.data?.data ?? response.data;
    return payload as {
      orders: ApiOrder[];
      pagination: Record<string, unknown>;
    };
  },

  pickOrder: async (orderId: string): Promise<{ order: ApiOrder }> => {
    const response = await api.patch(`/riders/orders/${orderId}/pick`, {});
    const payload = response.data?.data ?? response.data;
    return payload as { order: ApiOrder };
  },
};
