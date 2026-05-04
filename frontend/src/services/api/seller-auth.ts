import { api } from "../http/client";
import type { SellerProfile } from "./seller-registration";

export interface SellerLoginData {
  email: string;
  password: string;
}

export interface SellerAuthResponse {
  token: string;
  seller: SellerProfile;
}

export const sellerAuthAPI = {
  login: async (data: SellerLoginData): Promise<SellerAuthResponse> => {
    const response = await api.post("/seller/login", data);
    return response.data.data as SellerAuthResponse;
  },

  getProfile: async (): Promise<{ seller: SellerProfile }> => {
    const response = await api.get("/seller/profile");
    return response.data.data as { seller: SellerProfile };
  },

  updateProfile: async (
    data: Partial<SellerProfile>,
  ): Promise<{ seller: SellerProfile }> => {
    const response = await api.put("/seller/profile", data);
    return response.data.data as { seller: SellerProfile };
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/seller/logout");
    } catch {
      console.log(
        "Seller logout API call failed, continuing with local logout",
      );
    }
  },
};
