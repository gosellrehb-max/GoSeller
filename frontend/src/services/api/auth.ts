import { api } from "../http/client";

/** Normalized user from login/register/me/switch-role (backend may send extra fields). */
export interface AuthUser {
  id: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  role: string;
  roles?: string[];
  status?: string;
  pendingApproval?: boolean;
  [key: string]: unknown;
}

export interface LoginData {
  email: string;
  password: string;
  role?: "customer" | "seller" | "rider" | "admin" | "super-admin" | "user";
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
  verificationCode: string;
  role?: string;
  isSeller?: boolean;
  sellerType?: string;
  businessName?: string;
}

export interface RegisterResponse {
  user: AuthUser;
  token: string;
  message?: string;
}

function mergeUserRoleFromToken(
  user: Record<string, unknown> | null | undefined,
  token: string | undefined,
): Record<string, unknown> | null | undefined {
  if (!user || user.role) return user ?? undefined;
  if (!token) return user;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return user;
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const payload = JSON.parse(atob(b64)) as { role?: string };
    if (payload.role) return { ...user, role: payload.role };
  } catch {
    /* ignore */
  }
  return user;
}

function normalizeAuthUser(
  user: Record<string, unknown> | undefined,
  token: string | undefined,
): AuthUser {
  const base = (mergeUserRoleFromToken(user, token) ?? user ?? {}) as Record<
    string,
    unknown
  >;
  const idRaw =
    base.id?.toString?.() ??
    (base._id as { toString(): string } | undefined)?.toString?.() ??
    base.id;
  return {
    ...base,
    id: String(idRaw ?? ""),
    name: String(base.name ?? ""),
    email: String(base.email ?? ""),
    role: String(base.role ?? ""),
  } as AuthUser;
}

export const authAPI = {
  checkRegistrationEmail: async (
    email: string,
    role: "customer" | "seller" | "rider" | "user" = "customer",
  ): Promise<{
    email: string;
    canRegister: boolean;
    existingAccountWithoutRole: boolean;
    existingRoles?: string[];
    message: string;
  }> => {
    const response = await api.post("/auth/register/check-email", {
      email,
      role,
    });
    const payload = response.data?.data ?? response.data;
    return payload;
  },

  sendRegistrationCode: async (data: {
    email: string;
    role?: "customer" | "seller" | "rider" | "admin" | "super-admin" | "user";
    isSeller?: boolean;
  }): Promise<{
    email: string;
    role: string;
    expiresAt: string;
    sent: boolean;
    message: string;
    existingAccountWithoutRole?: boolean;
  }> => {
    const response = await api.post("/auth/register/send-code", data);
    return response.data?.data ?? response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", data);
    const payload = response.data?.data ?? response.data;
    const { token, user } = payload as {
      token: string;
      user: Record<string, unknown>;
    };
    const normalizedUser = normalizeAuthUser(user, token);
    if (typeof window !== "undefined" && token) {
      localStorage.removeItem("sellerToken");
      localStorage.setItem("authToken", token);
    }
    return { token, user: normalizedUser };
  },

  sendForgotPasswordCode: async (
    email: string,
  ): Promise<{
    email: string;
    sent?: boolean;
    expiresAt?: string;
    message: string;
  }> => {
    const response = await api.post("/auth/forgot-password/send-code", {
      email,
    });
    return response.data?.data ?? response.data;
  },

  resetPasswordWithCode: async (data: {
    email: string;
    verificationCode: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    const response = await api.post("/auth/forgot-password/reset", data);
    return response.data?.data ?? response.data;
  },

  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await api.post("/auth/register", data);
    const payload = response.data?.data ?? response.data;
    const { token, user, message } = payload as {
      token: string;
      user: Record<string, unknown>;
      message?: string;
    };
    const normalizedUser = normalizeAuthUser(user, token);
    if (typeof window !== "undefined" && token) {
      localStorage.removeItem("sellerToken");
      localStorage.setItem("authToken", token);
    }
    return { user: normalizedUser, token, message };
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
    }
  },

  getCurrentUser: async (): Promise<{ user: AuthUser }> => {
    const response = await api.get("/auth/me");
    const payload = response.data?.data ?? response.data;
    const user = payload?.user as Record<string, unknown> | undefined;
    const token =
      typeof window !== "undefined"
        ? (localStorage.getItem("authToken") ?? undefined)
        : undefined;
    return { user: normalizeAuthUser(user, token) };
  },

  switchRole: async (
    role: "customer" | "seller" | "rider",
  ): Promise<AuthResponse> => {
    const response = await api.post("/auth/switch-role", { role });
    const payload = response.data?.data ?? response.data;
    const { token, user } = payload as {
      token: string;
      user: Record<string, unknown>;
    };
    const normalizedUser = normalizeAuthUser(user, token);
    if (typeof window !== "undefined" && token) {
      localStorage.removeItem("sellerToken");
      localStorage.setItem("authToken", token);
    }
    return { token, user: normalizedUser };
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> => {
    const response = await api.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data?.data ?? response.data;
  },
};
