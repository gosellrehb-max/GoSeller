export type StablePrimitive = string | number | boolean | null | undefined;

/** Params-like object serialized for React Query keys (sorted keys, drops undefined). */
export type StableQueryParams = Record<string, StablePrimitive>;

/**
 * Stable JSON fragment for query keys so `{ b: 1, a: 2 }` and `{ a: 2, b: 1 }` collide.
 * Shared by marketplace and dashboard key factories.
 */
export function stableParamsKey(params?: StableQueryParams): string {
  if (!params) return '';
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}
