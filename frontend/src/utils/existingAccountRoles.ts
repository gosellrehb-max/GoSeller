const ROLE_TITLES: Record<string, string> = {
  customer: "Customer",
  seller: "Seller",
  rider: "Rider",
  admin: "Admin",
  "super-admin": "Administrator",
};

/**
 * Human-readable list of roles already on the account (e.g. "Customer", "Customer and Rider").
 * Use optional `exclude` when the target role should not appear in the list (e.g. seller signup UI).
 */
export function formatExistingRolesAsTitles(
  roles: string[] | undefined | null,
  options?: { exclude?: string[] },
): string {
  const exclude = new Set(options?.exclude ?? []);
  const filtered = Array.from(
    new Set((roles ?? []).filter((r) => r && !exclude.has(r))),
  );
  const titles = filtered.map(
    (r) => ROLE_TITLES[r] ?? r.charAt(0).toUpperCase() + r.slice(1),
  );
  if (titles.length === 0) return "";
  if (titles.length === 1) return titles[0];
  if (titles.length === 2) return `${titles[0]} and ${titles[1]}`;
  return `${titles.slice(0, -1).join(", ")}, and ${titles[titles.length - 1]}`;
}
