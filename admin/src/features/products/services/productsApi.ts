import axios, { AxiosHeaders } from 'axios';
import { readAdminToken } from '@/lib/admin-session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = readAdminToken();
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

export type AdminProduct = {
  _id: string;
  title: string;
  category?: string;
  status?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  featuredPriority?: number;
  featuredUntil?: string | null;
  trendingScore?: number;
  ordersLast24h?: number;
  viewsLast24h?: number;
  cartAddsLast24h?: number;
  wishlistLast24h?: number;
  images?: string[];
  imageUrl?: string;
};

export type ProductsListResult = {
  products: AdminProduct[];
  pagination: { current: number; pages: number; total: number; limit: number };
};

export const productsApi = {
  list: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<ProductsListResult> => {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 50));
    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.status?.trim()) query.set('status', params.status.trim());

    const res = await api.get(`/products?${query.toString()}`);
    const data = res.data?.data ?? res.data;
    return {
      products: Array.isArray(data?.products) ? data.products : [],
      pagination: data?.pagination ?? { current: 1, pages: 1, total: 0, limit: params.limit ?? 50 },
    };
  },

  updateFeatured: async (
    id: string,
    payload: { isFeatured: boolean; featuredPriority: number; featuredUntil: string | null },
  ): Promise<AdminProduct> => {
    const res = await api.put(`/products/${id}`, payload);
    const data = res.data?.data ?? res.data;
    return data.product as AdminProduct;
  },
};
