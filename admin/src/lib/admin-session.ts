/** Storage key written only by the admin login page. Do not read marketplace tokens here. */
export const ADMIN_TOKEN_STORAGE_KEY = 'admin_token';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const json = atob(b64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isAdminLike(role: unknown): boolean {
  return role === 'admin' || role === 'super-admin';
}

/** Best-effort JWT payload check for shell routing only; backend still enforces RolesGuard. */
export function jwtClaimsAllowAdminShell(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  const exp = payload.exp;
  if (typeof exp === 'number' && Date.now() >= exp * 1000) return false;
  if (isAdminLike(payload.role)) return true;
  const roles = payload.roles;
  if (!Array.isArray(roles)) return false;
  return roles.some(isAdminLike);
}

export function readAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)?.trim() ?? '';
}

export function hasAdminShellAccess(): boolean {
  const token = readAdminToken();
  return Boolean(token && jwtClaimsAllowAdminShell(token));
}
