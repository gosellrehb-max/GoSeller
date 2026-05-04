import { api } from "../http/client";

export interface SellerProfile {
  id: string;
  name: string;
  email: string;
  businessName: string;
  sellerCategory: string;
  status: string;
  phone?: string;
  businessType?: string;
  businessLicense?: string;
  areaOfDistribution?: string[];
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  /** Shown to riders as the pickup location. */
  storePickupAddress?: string;
  distributionArea?: string;
  authorizedTerritories?: string;
  storeDescription?: string;
  storeCategory?: string;
  storeLogoUrl?: string;
  storeBannerUrl?: string;
  businessDocumentUrls?: string[];
  verified?: boolean;
  capabilities: {
    productListing: boolean;
    priceControl: boolean;
    orderHandling: boolean;
    franchiseIncomeContribution: boolean;
    supplyChainFlowMonitoring: boolean;
    bulkOrderTools: boolean;
    dashboardRoleAccess: string;
  };
}

/** Multipart profile update body (text fields + optional files). */
export type SellerProfileUpdatePayload = Record<string, unknown> & {
  storeLogo?: File;
  storeBanner?: File;
  businessDocuments?: File[];
};

export const sellerRegistrationAPI = {
  getProfile: async (sellerId: string): Promise<{ seller: SellerProfile }> => {
    const response = await api.get(`/seller-registration/profile/${sellerId}`);
    return response.data.data as { seller: SellerProfile };
  },

  updateProfile: async (
    sellerId: string,
    data: SellerProfileUpdatePayload | FormData,
  ): Promise<{ seller: SellerProfile }> => {
    if (data instanceof FormData) {
      const response = await api.put(
        `/seller-registration/profile/${sellerId}`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data.data as { seller: SellerProfile };
    }

    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      if (
        key !== "storeLogo" &&
        key !== "storeBanner" &&
        key !== "businessDocuments"
      ) {
        const v = data[key];
        if (v === undefined || v === null) return;
        if (key === "areaOfDistribution" && Array.isArray(v)) {
          formData.append(key, JSON.stringify(v));
          return;
        }
        formData.append(key, String(v));
      }
    });

    if (data.storeLogo) {
      formData.append("storeLogo", data.storeLogo);
    }
    if (data.storeBanner) {
      formData.append("storeBanner", data.storeBanner);
    }
    if (data.businessDocuments) {
      data.businessDocuments.forEach((file: File) => {
        formData.append("businessDocuments", file);
      });
    }

    const response = await api.put(
      `/seller-registration/profile/${sellerId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data.data as { seller: SellerProfile };
  },

  getStats: async (
    sellerId: string,
  ): Promise<{ stats: Record<string, unknown> }> => {
    const response = await api.get(`/seller-registration/stats/${sellerId}`);
    return response.data.data as { stats: Record<string, unknown> };
  },
};
