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

export type AdminUser = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  roles: string[];
  status: string;
  authSource?: string;
  createdAt?: string;
};

export type UsersListResult = {
  users: AdminUser[];
  pagination: { current: number; pages: number; total: number };
};

export const usersApi = {
  list: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    userType?: string;
    isActive?: boolean | undefined;
  }): Promise<UsersListResult> => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.userType) query.set('userType', params.userType);
    if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
    const res = await api.get(`/users?${query.toString()}`);
    const data = res.data?.data ?? res.data;
    return {
      users: Array.isArray(data?.users) ? data.users : [],
      pagination: data?.pagination ?? { current: 1, pages: 1, total: 0 },
    };
  },

  createAdmin: async (payload: {
    name: string;
    email: string;
    password: string;
  }): Promise<AdminUser> => {
    const res = await api.post('/users', {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: 'admin',
      status: 'active',
    });
    const data = res.data?.data ?? res.data;
    return data.user as AdminUser;
  },

  updateStatus: async (id: string, status: 'active' | 'inactive' | 'suspended'): Promise<AdminUser> => {
    const res = await api.put(`/users/${id}`, { status });
    const data = res.data?.data ?? res.data;
    return data.user as AdminUser;
  },

  promoteToAdmin: async (id: string): Promise<AdminUser> => {
    const res = await api.put(`/users/${id}`, { role: 'admin' });
    const data = res.data?.data ?? res.data;
    return data.user as AdminUser;
  },
};
