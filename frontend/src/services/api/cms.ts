import { api } from "../http/client";

export interface CmsCarousel {
  id?: string;
  _id?: string;
  title: string;
  imageUrl: string;
  link: string;
  isActive?: boolean;
  order?: number;
}

export const cmsAPI = {
  getCarousels: async (): Promise<{ carousels: CmsCarousel[] }> => {
    const response = await api.get("/cms/carousels");
    const data = response.data?.data ?? response.data;
    return {
      carousels: Array.isArray(data?.carousels) ? data.carousels : [],
    };
  },
};
