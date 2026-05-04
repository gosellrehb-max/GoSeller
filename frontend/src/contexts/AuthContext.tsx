"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { authAPI, sellerAuthAPI, ridersAPI, usersAPI, RiderRegisterPayload } from '../services/api';
import { getApiErrorMessage } from '../utils/apiError';

export type AccountType = 'customer' | 'seller' | 'rider';

// User interface
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: string;
  /** Multi-role accounts (e.g. customer + rider) — UI must not rely on `role` alone. */
  roles?: string[];
  phone?: string;
}

/** True if this account can use rider APIs / rider profile (primary or multi-role). */
export function authUserIsRider(user: { role?: string; roles?: string[] } | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'rider') return true;
  if (Array.isArray(user.roles) && user.roles.includes('rider')) return true;
  if (typeof window !== 'undefined') {
    const active = localStorage.getItem('activeAccount');
    const token = localStorage.getItem('authToken') ?? '';
    if (active === 'rider' && token && parseJwtRole(token) === 'rider') return true;
  }
  return false;
}

function parseJwtRole(authToken: string): string {
  try {
    const parts = authToken.split('.');
    if (parts.length < 2) return '';
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const payload = JSON.parse(atob(b64)) as { role?: string };
    return String(payload.role ?? '');
  } catch {
    return '';
  }
}

function collectDbRoles(apiUser: Record<string, unknown>): Set<string> {
  const dbRoles = new Set<string>();
  if (typeof apiUser.role === 'string' && apiUser.role) dbRoles.add(apiUser.role);
  const arr = apiUser.roles;
  if (Array.isArray(arr)) {
    arr.forEach((r) => typeof r === 'string' && r && dbRoles.add(r));
  }
  return dbRoles;
}

/**
 * Align `activeAccount` with JWT + /auth/me so we do not reset multi-role riders to customer on every refresh
 * (previously we only checked `user.role === 'rider'` from the DB).
 */
function syncActiveAccountAfterAuthMe(authToken: string, apiUser: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const jwtRole = parseJwtRole(authToken);
  const dbRoles = collectDbRoles(apiUser);

  if (jwtRole === 'rider') {
    localStorage.setItem('activeAccount', 'rider');
    return;
  }
  if (jwtRole === 'seller') {
    localStorage.setItem('activeAccount', 'seller');
    return;
  }
  if (dbRoles.has('rider') && !dbRoles.has('customer') && !dbRoles.has('user')) {
    localStorage.setItem('activeAccount', 'rider');
    return;
  }
  const keep = localStorage.getItem('activeAccount');
  if (keep === 'rider' && dbRoles.has('rider')) {
    localStorage.setItem('activeAccount', 'rider');
    return;
  }
  localStorage.setItem('activeAccount', 'customer');
}

function applySessionRoleToUser(user: User): User {
  if (typeof window === 'undefined') return user;
  const active = localStorage.getItem('activeAccount');
  const token = localStorage.getItem('authToken') ?? '';
  const jwtRole = token ? parseJwtRole(token) : '';
  const roles = user.roles ?? [];
  // Trust the JWT role when the account actually owns it; fall back to active session hint.
  const candidate =
    jwtRole && (jwtRole === user.role || roles.includes(jwtRole))
      ? jwtRole
      : active && [user.role, ...roles].includes(active)
        ? active
        : null;
  if (candidate && candidate !== user.role) {
    return { ...user, role: candidate };
  }
  return user;
}

function profileUserFromApi(raw: unknown, roleFallback?: string): User | null {
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, unknown>;
  const idRaw = u.id ?? u._id;
  const id =
    typeof idRaw === 'string'
      ? idRaw
      : idRaw != null && typeof (idRaw as { toString?: () => string }).toString === 'function'
        ? String((idRaw as { toString(): string }).toString())
        : '';
  if (!id) return null;
  const rolesRaw = u.roles;
  const roles =
    Array.isArray(rolesRaw) && rolesRaw.length > 0
      ? rolesRaw.filter((x): x is string => typeof x === 'string' && !!x)
      : undefined;
  return {
    id,
    email: typeof u.email === 'string' ? u.email : '',
    firstName: typeof u.firstName === 'string' ? u.firstName : undefined,
    lastName: typeof u.lastName === 'string' ? u.lastName : undefined,
    name: typeof u.name === 'string' ? u.name : undefined,
    role: typeof u.role === 'string' ? u.role : roleFallback,
    roles,
    phone: typeof u.phone === 'string' ? u.phone : undefined,
  };
}

// Auth State Interface
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth Action Types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User };

// Auth Context Interface
interface AuthContextType extends AuthState {
  sendRegistrationCode: (payload: {
    email: string;
    accountType: AccountType;
    isSeller?: boolean;
  }) => Promise<{
    email: string;
    role: string;
    expiresAt: string;
    sent: boolean;
    message: string;
    existingAccountWithoutRole?: boolean;
  }>;
  login: (email: string, password: string) => Promise<void>;
  /** Login with account-type check (customer / seller / seller portal / rider). */
  loginWithAccountType: (email: string, password: string, accountType: AccountType) => Promise<void>;
  register: (userData: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role?: string;
    isSeller?: boolean;
    sellerType?: string;
    businessName?: string;
    verificationCode: string;
  }) => Promise<void>;
  /** Register delivery partner via POST /riders/register; stores authToken when token returned. */
  registerRider: (payload: RiderRegisterPayload) => Promise<void>;
  /**
   * Switch the active session role without password.
   * Requires the user already has the target role on their account (multi-role accounts).
   * Pass `{ quiet: true }` to skip the fullscreen loader (e.g. silent marketplace role normalization).
   */
  switchRole: (
    role: AccountType,
    options?: { quiet?: boolean },
  ) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  /** Refetch GET /auth/me and merge into context (e.g. profile page). */
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// Initial State
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [roleSwitchInProgress, setRoleSwitchInProgress] = useState(false);
  const pathname = usePathname();

  // Restore session: customer/rider JWT (authToken) or seller JWT (sellerToken)
  useEffect(() => {
    const parseJwtPayload = (jwt: string): Record<string, unknown> | null => {
      try {
        const parts = jwt.split('.');
        if (parts.length < 2) return null;
        let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        const json = atob(b64);
        return JSON.parse(json) as Record<string, unknown>;
      } catch {
        return null;
      }
    };

    const checkAuth = async () => {
      const authToken = localStorage.getItem('authToken');
      const sellerToken = localStorage.getItem('sellerToken');
      const SESSION_AUTH_CACHE_KEY = 'gosellr_auth_me_cache_v1';

      if (authToken) {
        // Proactive expiry check — avoids a wasted /auth/me round-trip for already-expired tokens.
        const authPayload = parseJwtPayload(authToken);
        const authExp = typeof authPayload?.exp === 'number' ? authPayload.exp : null;
        if (authExp && Date.now() >= authExp * 1000) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('sellerToken');
          sessionStorage.removeItem(SESSION_AUTH_CACHE_KEY);
          dispatch({ type: 'AUTH_FAILURE', payload: '' });
        } else {
          try {
          dispatch({ type: 'AUTH_START' });
          const cachedRaw = sessionStorage.getItem(SESSION_AUTH_CACHE_KEY);
          if (cachedRaw) {
            try {
              const cached = JSON.parse(cachedRaw) as { token?: string; user?: Record<string, unknown> };
              if (cached?.token === authToken && cached.user) {
                syncActiveAccountAfterAuthMe(authToken, cached.user);
                const parsedCached = profileUserFromApi(cached.user);
                if (parsedCached) {
                  dispatch({
                    type: 'AUTH_SUCCESS',
                    payload: { user: applySessionRoleToUser(parsedCached), token: authToken },
                  });
                  return;
                }
              }
            } catch {
              sessionStorage.removeItem(SESSION_AUTH_CACHE_KEY);
            }
          }
          const response = await authAPI.getCurrentUser();
          const raw = response.user as Record<string, unknown>;
          sessionStorage.setItem(SESSION_AUTH_CACHE_KEY, JSON.stringify({ token: authToken, user: raw }));
          syncActiveAccountAfterAuthMe(authToken, raw);
          const parsed = profileUserFromApi(raw);
          const userForState = parsed
            ? applySessionRoleToUser(parsed)
            : ({
                id: String(
                  raw.id ?? (raw._id as { toString(): string } | undefined)?.toString?.() ?? '',
                ),
                email: String(raw.email ?? ''),
                role: typeof raw.role === 'string' ? raw.role : 'customer',
                roles: Array.isArray(raw.roles)
                  ? raw.roles.filter((x): x is string => typeof x === 'string')
                  : undefined,
              } as User);
          // Keep sellerToken strictly in sync with authToken (only when active role is seller).
          const jwtRole = parseJwtRole(authToken);
          if (jwtRole === 'seller') {
            localStorage.setItem('sellerToken', authToken);
          } else {
            localStorage.removeItem('sellerToken');
          }
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: userForState, token: authToken },
          });
          return;
          } catch {
            localStorage.removeItem('authToken');
            localStorage.removeItem('sellerToken');
            sessionStorage.removeItem(SESSION_AUTH_CACHE_KEY);
          }
        } // end else (token not yet expired)
      }

      if (sellerToken) {
        const payload = parseJwtPayload(sellerToken);
        const exp = typeof payload?.exp === 'number' ? payload.exp : null;
        if (exp && Date.now() >= exp * 1000) {
          localStorage.removeItem('sellerToken');
          dispatch({ type: 'AUTH_FAILURE', payload: '' });
          return;
        }
        if (payload) {
          localStorage.setItem('activeAccount', 'seller');
          const id = String(payload.id ?? payload.sub ?? '');
          const email = String(payload.email ?? '');
          const role = String(payload.role ?? 'seller');
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: {
                id,
                email,
                role,
                name: typeof payload.name === 'string' ? payload.name : 'Seller',
              },
              token: sellerToken,
            },
          });
          return;
        }
        localStorage.removeItem('sellerToken');
      }

      dispatch({ type: 'AUTH_FAILURE', payload: '' });
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.login({ email, password });
      localStorage.removeItem('sellerToken');
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('activeAccount', 'customer');
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, token: response.token },
      });
    } catch (error: unknown) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: getApiErrorMessage(error, 'Login failed'),
      });
    }
  };

  const sendRegistrationCode = async (payload: {
    email: string;
    accountType: AccountType;
    isSeller?: boolean;
  }): Promise<{
    email: string;
    role: string;
    expiresAt: string;
    sent: boolean;
    message: string;
    existingAccountWithoutRole?: boolean;
  }> => {
    try {
      dispatch({ type: 'AUTH_START' });
      let response: Awaited<ReturnType<typeof authAPI.sendRegistrationCode>>;
      if (payload.accountType === 'rider') {
        response = await ridersAPI.sendRegistrationCode(payload.email);
      } else {
        response = await authAPI.sendRegistrationCode({
          email: payload.email,
          role: payload.accountType === 'seller' ? 'seller' : 'customer',
          isSeller: payload.isSeller,
        });
      }
      dispatch({ type: 'AUTH_FAILURE', payload: '' });
      return response;
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'Failed to send verification code');
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  };

  const loginWithAccountType = async (email: string, password: string, accountType: AccountType) => {
    try {
      dispatch({ type: 'AUTH_START' });
      if (accountType === 'seller') {
        const res = await sellerAuthAPI.login({ email, password });
        localStorage.removeItem('authToken');
        localStorage.setItem('sellerToken', res.token);
        localStorage.setItem('activeAccount', 'seller');
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: {
              id: String(res.seller?.id ?? ''),
              email,
              role: 'seller',
              name: res.seller?.businessName ?? 'Seller',
            },
            token: res.token,
          },
        });
        return;
      }
      const roleParam = accountType === 'customer' ? 'customer' : 'rider';
      const response = await authAPI.login({ email, password, role: roleParam });
      localStorage.removeItem('sellerToken');
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('activeAccount', accountType === 'rider' ? 'rider' : 'customer');
      const raw = response.user as Record<string, unknown>;
      const parsed = profileUserFromApi(raw);
      const userForState = applySessionRoleToUser(
        parsed ?? {
          id: String((response.user as { id?: unknown })?.id ?? ''),
          email: String((response.user as { email?: string })?.email ?? email),
          role: accountType === 'rider' ? 'rider' : 'customer',
        },
      );
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: userForState, token: response.token },
      });
    } catch (error: unknown) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: getApiErrorMessage(error, 'Login failed'),
      });
      throw error;
    }
  };

  const registerRider = async (payload: RiderRegisterPayload) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const res = await ridersAPI.register(payload);
      if (!res.token) {
        const msg = 'Registration did not return a session.';
        dispatch({ type: 'AUTH_FAILURE', payload: msg });
        throw new Error(msg);
      }
      localStorage.removeItem('sellerToken');
      localStorage.setItem('authToken', res.token);
      localStorage.setItem('activeAccount', 'rider');
      const u = res.user;
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: {
            id: String(u?.id ?? ''),
            email: String(u?.email ?? payload.email),
            role: 'rider',
            roles: ['rider'],
            name: String(u?.name ?? ''),
          },
          token: res.token,
        },
      });
    } catch (error: unknown) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: getApiErrorMessage(error, 'Rider registration failed'),
      });
      throw error;
    }
  };

  // Register function -> backend POST /auth/register (name, email, password, role?, isSeller?, sellerType?, businessName?)
  const register = async (userData: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role?: string;
    isSeller?: boolean;
    sellerType?: string;
    businessName?: string;
    verificationCode?: string;
  }) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const name = [userData.firstName, userData.lastName].filter(Boolean).join(' ').trim() || userData.email;
      const response = await authAPI.register({
        name,
        email: userData.email,
        password: userData.password,
        verificationCode: userData.verificationCode ?? '',
        role: userData.role,
        isSeller: userData.isSeller,
        sellerType: userData.sellerType,
        businessName: userData.businessName,
      });
      const token = response.token;
      const user = response.user as User;
      if (token && user) {
        localStorage.removeItem('sellerToken');
        localStorage.setItem('activeAccount', 'customer');
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: { ...user, id: String(user.id) }, token },
        });
        // response.message is set when account is pending approval (informational)
        return;
      }
      const msg = 'Registration did not complete.';
      dispatch({ type: 'AUTH_FAILURE', payload: msg });
      throw new Error(msg);
    } catch (error: unknown) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: getApiErrorMessage(error, 'Registration failed'),
      });
      throw error;
    }
  };

  const switchRole = async (
    role: AccountType,
    options?: { quiet?: boolean },
  ): Promise<{ ok: boolean; message?: string }> => {
    const quiet = options?.quiet === true;
    if (!quiet) setRoleSwitchInProgress(true);
    try {
      const response = await authAPI.switchRole(role);
      const token = response.token;
      const user = response.user as User;
      if (!token || !user) {
        return { ok: false, message: 'Switch failed: missing session.' };
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', token);
        if (role === 'seller') {
          // Mirror into sellerToken so legacy seller pages that still read `sellerToken` work seamlessly.
          localStorage.setItem('sellerToken', token);
        } else {
          localStorage.removeItem('sellerToken');
        }
        localStorage.setItem('activeAccount', role);
      }
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: { ...user, id: String(user.id), role }, token },
      });
      return { ok: true };
    } catch (error: unknown) {
      return { ok: false, message: getApiErrorMessage(error, 'Could not switch role.') };
    } finally {
      if (!quiet) setRoleSwitchInProgress(false);
    }
  };

  // Logout function -> backend POST /auth/logout then clear token
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Continue with logout even if API call fails
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('activeAccount');
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const { user: raw } = await authAPI.getCurrentUser();
      if (authToken && raw && typeof raw === 'object') {
        syncActiveAccountAfterAuthMe(authToken, raw as Record<string, unknown>);
      }
      const next = profileUserFromApi(raw);
      if (next) dispatch({ type: 'UPDATE_USER', payload: applySessionRoleToUser(next) });
    } catch {
      /* ignore */
    }
  }, []);

  const updateProfile = useCallback(
    async (userData: Partial<User>) => {
      const uid = state.user?.id;
      if (!uid) throw new Error('Not signed in');
      await usersAPI.update(uid, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
      });
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const { user: raw } = await authAPI.getCurrentUser();
      if (authToken && raw && typeof raw === 'object') {
        syncActiveAccountAfterAuthMe(authToken, raw as Record<string, unknown>);
      }
      const next = profileUserFromApi(raw, state.user?.role);
      if (next) dispatch({ type: 'UPDATE_USER', payload: applySessionRoleToUser(next) });
    },
    [state.user?.id, state.user?.role],
  );

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // UX: auth form errors should not leak to other pages/routes.
  useEffect(() => {
    if (state.error) {
      dispatch({ type: 'CLEAR_ERROR' });
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const value: AuthContextType = {
    ...state,
    login,
    sendRegistrationCode,
    loginWithAccountType,
    register,
    registerRider,
    switchRole,
    logout,
    updateProfile,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {roleSwitchInProgress ? (
        <div
          className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/40 backdrop-blur-[1px]"
          role="alertdialog"
          aria-modal="true"
          aria-busy="true"
          aria-label="Switching account role"
        >
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-8 py-6 shadow-xl">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
            <p className="text-sm font-medium text-gray-700">Switching account…</p>
          </div>
        </div>
      ) : null}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
