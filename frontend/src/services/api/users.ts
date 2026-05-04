import { api } from "../http/client";

export const usersAPI = {
  update: async (
    id: string,
    body: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      address?: string;
      deliveryLocation?: { address: string; lat: number; lng: number };
    },
  ): Promise<{ user: Record<string, unknown> }> => {
    const response = await api.put(`/users/${id}`, body);
    const payload = response.data?.data ?? response.data;
    return payload as { user: Record<string, unknown> };
  },
};
