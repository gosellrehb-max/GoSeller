import axios, { AxiosHeaders } from "axios";

// API base URL — Next.js public env (set at build time). Example: /api when using a Next rewrite to the backend.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      const h = config.headers;
      if (h instanceof AxiosHeaders) {
        h.delete("Content-Type");
      } else if (h && typeof h === "object") {
        delete (h as Record<string, unknown>)["Content-Type"];
      }
    }
    if (typeof window !== "undefined") {
      const authToken = localStorage.getItem("authToken");
      const sellerToken = localStorage.getItem("sellerToken");
      const token = authToken || sellerToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = String(error.config?.url || "");
    const isAuthMe = url.includes("/auth/me");

    if (error.response?.status === 401 && isAuthMe) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("sellerToken");
      }
    }
    return Promise.reject(error);
  },
);

export default api;
