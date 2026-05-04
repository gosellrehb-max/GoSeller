/**
 * Normalize variant option lists from API/forms (arrays, comma- or semicolon-separated strings).
 */
export function normalizeVariantOptions(options: unknown): string[] {
  if (Array.isArray(options)) {
    return options.map((o) => String(o).trim()).filter(Boolean);
  }
  if (typeof options === 'string') {
    return options
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export type NormalizedVariant = { name: string; options: string[] };

/**
 * One row per variant *name*. Merges duplicate names (e.g. three API rows all named "Size"
 * with one option each) into a single row so radios render on one horizontal line.
 */
export function normalizeProductVariants(variants: unknown): NormalizedVariant[] {
  if (!Array.isArray(variants)) return [];
  const byName = new Map<string, string[]>();
  for (const v of variants as Record<string, unknown>[]) {
    const name = String(v?.name ?? '').trim();
    if (!name) continue;
    const opts = normalizeVariantOptions(v?.options);
    if (opts.length === 0) continue;
    const existing = byName.get(name) ?? [];
    for (const o of opts) {
      if (!existing.includes(o)) existing.push(o);
    }
    byName.set(name, existing);
  }
  return Array.from(byName.entries()).map(([name, options]) => ({ name, options }));
}

/** Stable key for cart dedupe: same product + same choices. */
export function buildVariantKey(selection: Record<string, string>): string {
  const entries = Object.keys(selection)
    .sort()
    .map((k) => [k, selection[k]] as const);
  return JSON.stringify(entries);
}

export function formatVariantLabel(selection: Record<string, string>): string {
  return Object.keys(selection)
    .sort()
    .map((k) => `${k}: ${selection[k]}`)
    .join(' · ');
}
