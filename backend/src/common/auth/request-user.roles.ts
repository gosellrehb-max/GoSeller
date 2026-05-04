/**
 * Request user shape after JwtStrategy validates.
 * - `role`: active session role from JWT (JwtStrategy copies payload.role onto the document).
 * - `roles`: persisted grants on the User document (multi-role accounts).
 *
 * Authorization rules:
 * - Use **granted** helpers when checking “may this account ever act as X?” (checkout as customer, seller analytics).
 * - Use **active** helpers when behavior must follow the current JWT (order list variant, cancel attribution, rider assignment).
 */

export type RequestUser = {
  id?: string;
  _id?: { toString(): string };
  role?: string;
  roles?: string[];
};

/** JWT active role only (normalized string). */
export function activeRole(user: RequestUser | null | undefined): string {
  const r = user?.role;
  return r != null && r !== "" ? String(r).trim() : "";
}

export function hasActiveRole(
  user: RequestUser | null | undefined,
  candidate: string,
): boolean {
  return activeRole(user) === candidate;
}

/**
 * Union of persisted `roles[]` and the active JWT role.
 * Fixes the edge case where `roles` is `[]` but `role` is still set (legacy checks used the empty array).
 */
export function grantedRoles(user: RequestUser | null | undefined): string[] {
  if (!user) return [];
  const act = activeRole(user);
  const fromDoc = Array.isArray(user.roles)
    ? user.roles.map((r) => String(r).trim()).filter(Boolean)
    : [];
  const set = new Set<string>(fromDoc);
  if (act) set.add(act);
  return [...set];
}

export function hasAnyGrantedRole(
  user: RequestUser | null | undefined,
  candidates: readonly string[],
): boolean {
  const g = grantedRoles(user);
  return candidates.some((c) => g.includes(c));
}

export function hasAdminGrant(user: RequestUser | null | undefined): boolean {
  return hasAnyGrantedRole(user, ["admin", "super-admin"]);
}

/** Normalize Passport/user payloads that sometimes nest under `.user`. */
export function requestUserFromPayload(reqUser: unknown): RequestUser {
  if (!reqUser || typeof reqUser !== "object") return {};
  const u = reqUser as Record<string, unknown>;
  const nested =
    u.user && typeof u.user === "object"
      ? (u.user as Record<string, unknown>)
      : null;
  const role = (u.role ?? nested?.role) as string | undefined;
  const roles = (
    Array.isArray(u.roles) ? u.roles : nested?.roles
  ) as string[] | undefined;
  return {
    id: u.id as string | undefined,
    _id: u._id as { toString(): string } | undefined,
    role,
    roles,
  };
}
