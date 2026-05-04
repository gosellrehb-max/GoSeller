import { AREA_OF_DISTRIBUTION_VALUES } from './schemas/seller.schema';

type Allowed = (typeof AREA_OF_DISTRIBUTION_VALUES)[number];

/** Parse multipart / JSON body into a deduped list of allowed areas. */
export function parseAreaOfDistributionFromRequest(raw: unknown): string[] {
  if (raw === undefined || raw === null) return [];
  if (Array.isArray(raw)) {
    const out = raw
      .map((x) => String(x).trim())
      .filter((x) => AREA_OF_DISTRIBUTION_VALUES.includes(x as Allowed));
    return [...new Set(out)];
  }
  const s = String(raw).trim();
  if (!s) return [];
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s) as unknown;
      if (Array.isArray(parsed)) return parseAreaOfDistributionFromRequest(parsed);
    } catch {
      /* ignore */
    }
  }
  if (AREA_OF_DISTRIBUTION_VALUES.includes(s as Allowed)) return [s];
  return [];
}

/** Normalize value read from MongoDB (array, legacy single string, or invalid). */
export function normalizeStoredAreasOfDistribution(raw: unknown): string[] {
  return parseAreaOfDistributionFromRequest(raw);
}
