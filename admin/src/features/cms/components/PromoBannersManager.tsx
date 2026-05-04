'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
/* Inline SVG icons — no extra dependency */
const FiChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
);
const FiChevronUp = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
);
const FiImage = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
);
const FiTrash2 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
);
const FiPlus = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const FiSave = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);
const FiCalendar = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
import { cmsApi } from '@/features/cms/services/cmsApi';
import type { CmsPromoBanner, EventMosaicTile } from '@/features/cms/types/cms';

/* ─────────────────────────── constants ─────────────────────────── */

const FLASH_SLOTS = [
  {
    slot: 'flash_after_discounts',
    label: 'Flash Banner — "Stock the pantry"',
    description: 'Appears between the Discounts shelf and Trending shelf. Banner sits beside a product scroll.',
    defaultMediaSide: 'left' as const,
  },
  {
    slot: 'flash_after_get_it_all',
    label: 'Flash Banner — "Nursery savings"',
    description: 'Appears after the category carousel. Banner sits beside a product scroll.',
    defaultMediaSide: 'right' as const,
  },
];

const TILE_POSITIONS: EventMosaicTile['position'][] = [
  'left', 'centerTop', 'centerBottomLeft', 'centerBottomRight', 'right',
];

const TILE_LABELS: Record<EventMosaicTile['position'], { label: string; hint: string }> = {
  left: { label: 'Left — tall', hint: 'Full-height left column' },
  centerTop: { label: 'Centre Top — wide', hint: 'Spans both centre columns, top row' },
  centerBottomLeft: { label: 'Centre Bottom-Left — small', hint: 'Bottom-left centre cell' },
  centerBottomRight: { label: 'Centre Bottom-Right — small', hint: 'Bottom-right centre cell' },
  right: { label: 'Right — tall', hint: 'Full-height right column' },
};

/* ─────────────────────────── helpers ─────────────────────────── */

function idOf(b: CmsPromoBanner) { return String(b._id ?? b.id ?? ''); }

function emptyFlashBanner(slot: string, mediaSide: 'left' | 'right'): CmsPromoBanner {
  return {
    type: 'flash_banner', slot, isActive: true, sortOrder: 0,
    sectionTitle: '', sectionSubtitle: '', mediaSide,
    imageUrl: '', eyebrow: '', headline: '', description: '',
    ctaLabel: 'Shop now', ctaHref: '/products',
    priceNow: null, priceWas: null,
  };
}

function emptyEventMosaic(): CmsPromoBanner {
  return {
    type: 'event_mosaic', slot: '', isActive: true, sortOrder: 0,
    eventHeadline: '', startsAt: null, endsAt: null,
    tiles: TILE_POSITIONS.map((position) => ({
      position, title: '', description: '', eyebrow: '',
      imageUrl: '', ctaLabel: 'Shop now', ctaHref: '/products',
    })),
  };
}

/* ─────────────────────────── sub-components ─────────────────────────── */

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400';
const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${active ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'}`}>
      <span className={`h-2 w-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
      {active ? 'Live' : 'Hidden'}
    </span>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${checked ? 'bg-primary' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function ImageField({
  label,
  url,
  onChange,
}: {
  label: string;
  url: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const uploaded = await cmsApi.uploadImage(file);
      if (uploaded) onChange(uploaded);
      else toast.error('Upload returned no URL.');
    } catch {
      toast.error('Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className={labelCls}>{label}</p>

      {url ? (
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 group">
          <img src={url} alt="Preview" className="w-full h-44 object-contain" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <label className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow hover:bg-gray-50">
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
              {uploading ? 'Uploading…' : 'Replace'}
            </label>
            <button type="button" onClick={() => onChange('')} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-600">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-8 transition hover:border-primary/50 hover:bg-primary/5">
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
          <FiImage className="h-8 w-8 text-gray-300" />
          <span className="text-sm font-medium text-gray-500">
            {uploading ? 'Uploading…' : 'Click to upload an image'}
          </span>
          <span className="text-xs text-gray-400">PNG, JPG, WebP — recommended 1200×600px</span>
        </label>
      )}

      <input
        type="url"
        value={url}
        onChange={(e) => onChange(e.target.value)}
        placeholder="or paste an image URL directly"
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/20 placeholder:text-gray-400"
      />
    </div>
  );
}

/* ─────────────────────────── FlashBannerCard ─────────────────────────── */

function FlashBannerCard({
  slotMeta,
  existing,
  onSaved,
}: {
  slotMeta: (typeof FLASH_SLOTS)[number];
  existing: CmsPromoBanner | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CmsPromoBanner>(
    () => existing ?? emptyFlashBanner(slotMeta.slot, slotMeta.defaultMediaSide),
  );
  const [saving, setSaving] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setForm(existing ?? emptyFlashBanner(slotMeta.slot, slotMeta.defaultMediaSide));
  }, [existing, slotMeta.slot, slotMeta.defaultMediaSide]);

  const set = <K extends keyof CmsPromoBanner>(key: K, val: CmsPromoBanner[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  /** Toggle active — immediately persists if a record already exists in DB */
  const handleToggleActive = async (next: boolean) => {
    set('isActive', next);
    if (!existing) return; // no record yet — will be saved with full form
    setTogglingActive(true);
    try {
      await cmsApi.upsertPromoBanner(slotMeta.slot, { ...form, isActive: next });
      toast.success(next ? 'Banner is now live.' : 'Banner hidden.');
      onSaved();
    } catch {
      set('isActive', !next); // revert on failure
      toast.error('Could not update status.');
    } finally {
      setTogglingActive(false);
    }
  };

  const handleSave = async () => {
    if (!form.headline?.trim()) { toast.error('Headline is required.'); return; }
    if (!form.imageUrl?.trim()) { toast.error('Banner image is required.'); return; }
    setSaving(true);
    try {
      await cmsApi.upsertPromoBanner(slotMeta.slot, form);
      toast.success('Banner saved.');
      onSaved();
    } catch {
      toast.error('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-sm font-bold text-gray-900">{slotMeta.label}</h3>
            <StatusBadge active={form.isActive} />
          </div>
          <p className="mt-0.5 text-xs text-gray-500">{slotMeta.description}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{form.isActive ? 'Live' : 'Hidden'}</span>
            {togglingActive
              ? <span className="h-5 w-9 animate-pulse rounded-full bg-gray-200" />
              : <ToggleSwitch checked={form.isActive} onChange={(v) => void handleToggleActive(v)} />}
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            {open ? <><FiChevronUp className="h-3.5 w-3.5" /> Collapse</> : <><FiChevronDown className="h-3.5 w-3.5" /> Edit</>}
          </button>
        </div>
      </div>

      {/* Collapsed image strip */}
      {!open && form.imageUrl && (
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <img src={form.imageUrl} alt="" className="h-16 rounded-lg object-cover w-full max-w-xs" />
          {form.headline && <p className="mt-1.5 text-xs font-semibold text-gray-700 truncate">{form.headline}</p>}
        </div>
      )}
      {!open && !form.imageUrl && (
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-amber-600 font-medium">⚠ No image set — click Edit to configure this banner.</p>
        </div>
      )}

      {/* Expanded form */}
      {open && (
        <div className="p-5 space-y-6">
          {/* Image */}
          <ImageField
            label="Banner image *"
            url={form.imageUrl ?? ''}
            onChange={(url) => set('imageUrl', url)}
          />

          {/* Text fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Section title</label>
              <input type="text" value={form.sectionTitle ?? ''} onChange={(e) => set('sectionTitle', e.target.value)} placeholder="Stock the pantry for less" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Section subtitle</label>
              <input type="text" value={form.sectionSubtitle ?? ''} onChange={(e) => set('sectionSubtitle', e.target.value)} placeholder="Bundle & save on snacks, drinks & staples." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Eyebrow (small upper label)</label>
              <input type="text" value={form.eyebrow ?? ''} onChange={(e) => set('eyebrow', e.target.value)} placeholder="This week only" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Headline *</label>
              <input type="text" value={form.headline ?? ''} onChange={(e) => set('headline', e.target.value)} placeholder="Rollbacks on family favorites" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>CTA button label</label>
              <input type="text" value={form.ctaLabel ?? ''} onChange={(e) => set('ctaLabel', e.target.value)} placeholder="Shop deals" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>CTA link (URL)</label>
              <input type="text" value={form.ctaHref ?? ''} onChange={(e) => set('ctaHref', e.target.value)} placeholder="/products" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Price — Now (optional)</label>
              <input type="number" value={form.priceNow ?? ''} onChange={(e) => set('priceNow', e.target.value === '' ? null : Number(e.target.value))} placeholder="12.97" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Price — Was / strikethrough (optional)</label>
              <input type="number" value={form.priceWas ?? ''} onChange={(e) => set('priceWas', e.target.value === '' ? null : Number(e.target.value))} placeholder="18.47" className={inputCls} />
            </div>
          </div>

          <div className="max-w-xs">
            <label className={labelCls}>Banner position</label>
            <select value={form.mediaSide ?? 'left'} onChange={(e) => set('mediaSide', e.target.value as 'left' | 'right')} className={inputCls}>
              <option value="left">Banner left — products right</option>
              <option value="right">Products left — banner right</option>
            </select>
          </div>

          {/* Save */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
            >
              {saving
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : <FiSave className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save banner'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── EventMosaicCard ─────────────────────────── */

function TileAccordion({
  pos,
  tile,
  onChange,
  onImageChange,
}: {
  pos: EventMosaicTile['position'];
  tile: EventMosaicTile;
  onChange: (key: keyof EventMosaicTile, val: string) => void;
  onImageChange: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { label, hint } = TILE_LABELS[pos];
  const hasImage = Boolean(tile.imageUrl);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"
      >
        {hasImage
          ? <img src={tile.imageUrl} alt="" className="h-10 w-14 rounded-lg object-cover shrink-0 border border-gray-200" />
          : <div className="h-10 w-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
              <FiImage className="h-4 w-4 text-gray-400" />
            </div>
        }
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-800">{label}</p>
          <p className="text-[11px] text-gray-400 truncate">{tile.title || hint}</p>
        </div>
        {!hasImage && <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-wide mr-1">No image</span>}
        {open ? <FiChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <FiChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/60">
          <ImageField label="Tile image" url={tile.imageUrl} onChange={onImageChange} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Title</label>
              <input type="text" value={tile.title} onChange={(e) => onChange('title', e.target.value)} placeholder="Build Easter baskets" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Eyebrow</label>
              <input type="text" value={tile.eyebrow ?? ''} onChange={(e) => onChange('eyebrow', e.target.value)} placeholder="Spring" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <input type="text" value={tile.description ?? ''} onChange={(e) => onChange('description', e.target.value)} placeholder="Plush, candy & fillers — from $1." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>CTA label</label>
              <input type="text" value={tile.ctaLabel ?? ''} onChange={(e) => onChange('ctaLabel', e.target.value)} placeholder="Shop now" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>CTA link</label>
              <input type="text" value={tile.ctaHref ?? ''} onChange={(e) => onChange('ctaHref', e.target.value)} placeholder="/products" className={inputCls} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EventMosaicCard({
  existing,
  isNew,
  onSaved,
  onDeleted,
}: {
  existing: CmsPromoBanner;
  isNew?: boolean;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [form, setForm] = useState<CmsPromoBanner>(existing);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [open, setOpen] = useState(isNew ?? false);

  useEffect(() => { if (!isNew) setForm(existing); }, [existing, isNew]);

  const set = <K extends keyof CmsPromoBanner>(key: K, val: CmsPromoBanner[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  /** Toggle active — immediately persists if record already exists in DB */
  const handleToggleActive = async (next: boolean) => {
    set('isActive', next);
    const bid = idOf(existing);
    if (!bid || isNew) return; // unsaved new event — will be saved with full form
    setTogglingActive(true);
    try {
      await cmsApi.upsertPromoBanner(form.slot || existing.slot, { ...form, isActive: next });
      toast.success(next ? 'Event is now live.' : 'Event hidden.');
      onSaved();
    } catch {
      set('isActive', !next); // revert on failure
      toast.error('Could not update status.');
    } finally {
      setTogglingActive(false);
    }
  };

  const setTileField = (pos: EventMosaicTile['position'], key: keyof EventMosaicTile, val: string) => {
    setForm((f) => {
      const existing = (f.tiles ?? []).find((t) => t.position === pos);
      const updated = (f.tiles ?? []).map((t) => t.position === pos ? { ...t, [key]: val } : t);
      if (!existing) updated.push({ position: pos, title: '', description: '', eyebrow: '', imageUrl: '', ctaLabel: 'Shop now', ctaHref: '/products', [key]: val });
      return { ...f, tiles: updated };
    });
  };

  const tileOf = (pos: EventMosaicTile['position']): EventMosaicTile =>
    form.tiles?.find((t) => t.position === pos) ?? {
      position: pos, title: '', description: '', eyebrow: '', imageUrl: '', ctaLabel: 'Shop now', ctaHref: '/products',
    };

  const handleSave = async () => {
    if (!form.slot.trim()) { toast.error('Event slug is required.'); return; }
    if (!form.eventHeadline?.trim()) { toast.error('Event headline is required.'); return; }
    setSaving(true);
    try {
      await cmsApi.upsertPromoBanner(form.slot, form);
      toast.success('Event saved.');
      onSaved();
    } catch {
      toast.error('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const bid = idOf(existing);
    if (!bid && !isNew) return;
    if (isNew) { onDeleted(); return; }
    if (!confirm(`Delete event "${form.eventHeadline || form.slot}"?`)) return;
    setDeleting(true);
    try {
      await cmsApi.deletePromoBanner(bid);
      toast.success('Event deleted.');
      onDeleted();
    } catch {
      toast.error('Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const tilesWithImages = (form.tiles ?? []).filter((t) => t.imageUrl).length;
  const startDate = form.startsAt ? new Date(form.startsAt).toLocaleDateString() : null;
  const endDate = form.endsAt ? new Date(form.endsAt).toLocaleDateString() : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-sm font-bold text-gray-900">
              {form.eventHeadline || form.slot || 'New Event'}
            </h3>
            <StatusBadge active={form.isActive} />
            <span className="text-xs text-gray-400">{tilesWithImages}/5 tiles with images</span>
          </div>
          {(startDate || endDate) && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
              <FiCalendar className="h-3 w-3" />
              {startDate && endDate ? `${startDate} → ${endDate}` : startDate ? `From ${startDate}` : `Until ${endDate}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{form.isActive ? 'Live' : 'Hidden'}</span>
            {togglingActive
              ? <span className="h-5 w-9 animate-pulse rounded-full bg-gray-200" />
              : <ToggleSwitch checked={form.isActive} onChange={(v) => void handleToggleActive(v)} />}
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            {open ? <><FiChevronUp className="h-3.5 w-3.5" /> Collapse</> : <><FiChevronDown className="h-3.5 w-3.5" /> Edit</>}
          </button>
        </div>
      </div>

      {/* Collapsed tile strip */}
      {!open && (
        <div className="flex gap-2 px-5 py-3 bg-gray-50/60 border-b border-gray-100 overflow-x-auto">
          {TILE_POSITIONS.map((pos) => {
            const t = tileOf(pos);
            return t.imageUrl
              ? <img key={pos} src={t.imageUrl} alt={t.title || pos} className="h-12 w-16 rounded-lg object-cover shrink-0 border border-gray-200" title={t.title} />
              : <div key={pos} className="h-12 w-16 rounded-lg bg-gray-200 flex items-center justify-center shrink-0 border border-gray-200">
                  <FiImage className="h-4 w-4 text-gray-400" />
                </div>;
          })}
        </div>
      )}

      {/* Expanded form */}
      {open && (
        <div className="p-5 space-y-6">
          {/* Event metadata */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Event slug (unique ID) *</label>
              <input type="text" value={form.slot} onChange={(e) => set('slot', e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="easter-spring" className={inputCls} />
              <p className="mt-1 text-[11px] text-gray-400">URL-safe ID, e.g. "summer-kickoff". Cannot be changed after first save.</p>
            </div>
            <div>
              <label className={labelCls}>Display headline *</label>
              <input type="text" value={form.eventHeadline ?? ''} onChange={(e) => set('eventHeadline', e.target.value)} placeholder="Easter" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Starts at (optional)</label>
              <input type="datetime-local" value={form.startsAt ? form.startsAt.slice(0, 16) : ''} onChange={(e) => set('startsAt', e.target.value ? new Date(e.target.value).toISOString() : null)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ends at (optional)</label>
              <input type="datetime-local" value={form.endsAt ? form.endsAt.slice(0, 16) : ''} onChange={(e) => set('endsAt', e.target.value ? new Date(e.target.value).toISOString() : null)} className={inputCls} />
            </div>
          </div>

          {/* Tiles */}
          <div>
            <p className={labelCls + ' mb-3'}>Mosaic tiles — 5 panels</p>
            <div className="space-y-2">
              {TILE_POSITIONS.map((pos) => (
                <TileAccordion
                  key={pos}
                  pos={pos}
                  tile={tileOf(pos)}
                  onChange={(key, val) => setTileField(pos, key, val)}
                  onImageChange={(url) => setTileField(pos, 'imageUrl', url)}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
            >
              <FiTrash2 className="h-4 w-4" />
              {deleting ? 'Deleting…' : isNew ? 'Cancel' : 'Delete event'}
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
            >
              {saving
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : <FiSave className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save event'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Main ─────────────────────────── */

export default function PromoBannersManager() {
  const [banners, setBanners] = useState<CmsPromoBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingEvent, setAddingEvent] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setBanners(await cmsApi.getPromoBanners()); }
    catch { toast.error('Could not load promo banners.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const flashFor = (slot: string) =>
    banners.find((b) => b.type === 'flash_banner' && b.slot === slot) ?? null;

  const events = banners.filter((b) => b.type === 'event_mosaic');

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-10">

      {/* ── Flash Insert Banners ── */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">Flash Insert Banners</h2>
          <p className="mt-1 text-sm text-gray-500">
            Two promo banners that appear between product shelves on the homepage — each paired with a scrollable product carousel. If no image is set, the section falls back to the built-in defaults.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-gray-200 bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {FLASH_SLOTS.map((slotMeta) => (
              <FlashBannerCard
                key={slotMeta.slot}
                slotMeta={slotMeta}
                existing={flashFor(slotMeta.slot)}
                onSaved={load}
              />
            ))}
          </div>
        )}
      </section>

      <div className="border-t border-gray-200" />

      {/* ── Event Mosaics ── */}
      <section>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Seasonal Event Mosaics</h2>
            <p className="mt-1 text-sm text-gray-500">
              Full-width 5-tile image grids shown between New Arrivals and the product shelves. Use these for seasonal campaigns (Easter, Eid, Summer, etc.). Multiple events can be scheduled with start/end dates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setAddingEvent(true); }}
            disabled={addingEvent}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
          >
            <FiPlus className="h-4 w-4" />
            New event
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-24 animate-pulse rounded-2xl border border-gray-200 bg-gray-100" />
          </div>
        ) : (
          <div className="space-y-4">
            {events.length === 0 && !addingEvent && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 py-14 text-center">
                <FiCalendar className="h-8 w-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">No events yet</p>
                <p className="text-xs text-gray-400 max-w-xs">
                  Create a seasonal event to display a 5-tile mosaic on the homepage. Events only show if Active and within their date window.
                </p>
                <button
                  type="button"
                  onClick={() => setAddingEvent(true)}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  <FiPlus className="h-4 w-4" /> Create first event
                </button>
              </div>
            )}

            {events.map((ev) => (
              <EventMosaicCard
                key={idOf(ev)}
                existing={ev}
                onSaved={load}
                onDeleted={load}
              />
            ))}

            {addingEvent && (
              <EventMosaicCard
                existing={emptyEventMosaic()}
                isNew
                onSaved={() => { setAddingEvent(false); void load(); }}
                onDeleted={() => setAddingEvent(false)}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
