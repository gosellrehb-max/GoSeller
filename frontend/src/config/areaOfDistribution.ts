/** Pilot regions — aligned with backend `AREA_OF_DISTRIBUTION_VALUES`. */
export const AREA_OF_DISTRIBUTION_OPTIONS = ['Islamabad', 'Rawalpindi'] as const;
export type AreaOfDistributionOption = (typeof AREA_OF_DISTRIBUTION_OPTIONS)[number];

const ALLOWED = new Set<string>(AREA_OF_DISTRIBUTION_OPTIONS);

/** Normalize API / legacy values into a deduped list of allowed areas. */
export function normalizeAreasFromProfile(
  v: string | string[] | undefined | null,
): AreaOfDistributionOption[] {
  if (Array.isArray(v)) {
    const out = v.map((x) => String(x).trim()).filter((x) => ALLOWED.has(x));
    const deduped = out.filter((value, index) => out.indexOf(value) === index);
    return deduped as AreaOfDistributionOption[];
  }
  if (typeof v === 'string' && v.trim().startsWith('[')) {
    try {
      const p = JSON.parse(v) as unknown;
      if (Array.isArray(p)) return normalizeAreasFromProfile(p);
    } catch {
      return [];
    }
  }
  if (typeof v === 'string' && v.trim() && ALLOWED.has(v.trim())) {
    return [v.trim() as AreaOfDistributionOption];
  }
  return [];
}
