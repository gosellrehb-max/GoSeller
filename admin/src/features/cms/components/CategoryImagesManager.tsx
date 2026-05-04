'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { cmsApi } from '@/features/cms/services/cmsApi';
import type { CmsPromoBanner } from '@/features/cms/types/cms';

/* ─── category manifest — mirrors frontend categories.ts ─── */
const CATEGORIES = [
  { name: 'Grocery',     slug: 'grocery',     emoji: '🛒' },
  { name: 'Electronics', slug: 'electronics', emoji: '📱' },
  { name: 'Fashion',     slug: 'fashion',     emoji: '👗' },
  { name: 'Home',        slug: 'home',        emoji: '🏠' },
  { name: 'Beauty',      slug: 'beauty',      emoji: '💄' },
  { name: 'Sports',      slug: 'sports',      emoji: '⚽' },
  { name: 'Books',       slug: 'books',       emoji: '📚' },
  { name: 'Automotive',  slug: 'automotive',  emoji: '🚗' },
  { name: 'Health',      slug: 'health',      emoji: '🏥' },
  { name: 'Other',       slug: 'other',       emoji: '📦' },
] as const;

type CatMeta = (typeof CATEGORIES)[number];

/* ─── single category card ─── */
function CategoryCard({
  cat,
  existing,
  onSaved,
}: {
  cat: CatMeta;
  existing: CmsPromoBanner | null;
  onSaved: () => void;
}) {
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isDirty = imageUrl !== (existing?.imageUrl ?? '');

  useEffect(() => {
    setImageUrl(existing?.imageUrl ?? '');
  }, [existing?.imageUrl]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await cmsApi.uploadImage(file);
      if (url) setImageUrl(url);
      else toast.error('Upload returned no URL.');
    } catch {
      toast.error('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!imageUrl.trim()) { toast.error('Please upload or paste an image URL.'); return; }
    setSaving(true);
    try {
      await cmsApi.upsertPromoBanner(cat.slug, {
        type: 'category_image',
        imageUrl: imageUrl.trim(),
        isActive: true,
        sortOrder: 0,
      });
      toast.success(`${cat.name} image saved.`);
      onSaved();
    } catch {
      toast.error('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden border border-gray-200 bg-white shadow-sm flex flex-col">
      {/* Square image area */}
      <div className="relative group aspect-square w-full">
        {uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50">
            <span className="relative flex h-9 w-9">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-30" />
              <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <svg className="h-5 w-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              </span>
            </span>
            <p className="text-[11px] font-medium text-gray-400 tracking-wide">Uploading…</p>
          </div>
        ) : imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={cat.name}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => { e.currentTarget.src = ''; }}
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <label className="cursor-pointer rounded bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow hover:bg-gray-50">
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUpload(f); }} />
                Replace
              </label>
              <button type="button" onClick={() => setImageUrl('')}
                className="rounded bg-red-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-600">
                Remove
              </button>
            </div>
          </>
        ) : (
          <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 bg-gray-50 transition hover:bg-gray-100">
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUpload(f); }} />
            <span className="text-3xl leading-none">{cat.emoji}</span>
            <span className="text-[11px] font-medium text-gray-400">Click to upload</span>
          </label>
        )}
      </div>

      {/* Info & controls */}
      <div className="flex flex-col gap-2.5 p-3">
        <p className="text-sm font-bold text-gray-900">{cat.name}</p>

        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Paste image URL…"
          className="w-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 outline-none transition focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/20 placeholder:text-gray-400"
        />

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !isDirty || !imageUrl.trim()}
          className="inline-flex w-full items-center justify-center gap-2 bg-primary py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving
            ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            : null}
          {saving ? 'Saving…' : isDirty && imageUrl ? 'Save image' : imageUrl ? 'Saved ✓' : 'No image set'}
        </button>
      </div>
    </div>
  );
}

/* ─── main ─── */
export default function CategoryImagesManager() {
  const [records, setRecords] = useState<CmsPromoBanner[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await cmsApi.getPromoBanners();
      setRecords(all.filter((b) => b.type === 'category_image'));
    } catch {
      toast.error('Could not load category images.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const existingFor = (slug: string) =>
    records.find((r) => r.slot === slug) ?? null;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Category Images</h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload one representative image per category. These appear in the{' '}
          <span className="font-medium text-gray-700">"Get it all right here"</span> carousel on the homepage
          and on the <span className="font-medium text-gray-700">/products</span> browse page.
          Recommended size: <strong>600×600 px</strong>, PNG or WebP with transparent background.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((c) => (
            <div key={c.slug} className="aspect-square w-full animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.slug}
              cat={cat}
              existing={existingFor(cat.slug)}
              onSaved={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
