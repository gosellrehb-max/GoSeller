'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { cmsApi } from '@/features/cms/services/cmsApi';
import {
  useCmsCarousels,
  useCreateCmsCarousel,
  useDeleteCmsCarousel,
  useUpdateCmsCarousel,
} from '@/features/cms/hooks/useCmsCarousels';
import type { CmsCarousel } from '@/features/cms/types/cms';

type Draft = {
  title: string;
  link: string;
  imageUrl: string;
  isActive: boolean;
  order: string;
};

const emptyDraft = (): Draft => ({
  title: '',
  link: '',
  imageUrl: '',
  isActive: true,
  order: '',
});

export default function CmsCarouselManager() {
  const [authState] = useState<'checking' | 'authed' | 'unauthenticated'>('authed');
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data = [], isLoading, refetch } = useCmsCarousels(authState === 'authed');
  const createMutation = useCreateCmsCarousel();
  const updateMutation = useUpdateCmsCarousel();
  const deleteMutation = useDeleteCmsCarousel();

  const sorted = useMemo(
    () => [...data].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)),
    [data],
  );

  const idOf = (row: CmsCarousel): string => String(row._id ?? row.id ?? '');

  const createCarousel = async () => {
    if (!draft.title.trim() || !draft.link.trim() || !draft.imageUrl.trim()) {
      toast.error('Title, link and image are required.');
      return;
    }
    try {
      await createMutation.mutateAsync({
        title: draft.title.trim(),
        link: draft.link.trim(),
        imageUrl: draft.imageUrl.trim(),
        isActive: draft.isActive,
        order: Number(draft.order.trim()) || 0,
      });
      setDraft(emptyDraft());
      toast.success('Carousel item created.');
    } catch {
      toast.error('Failed to create carousel item.');
    }
  };

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      const url = await cmsApi.uploadImage(file);
      if (!url) throw new Error('Upload did not return URL');
      setDraft((prev) => ({ ...prev, imageUrl: url }));
      toast.success('Image uploaded.');
    } catch {
      toast.error('Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const saveRow = async (row: CmsCarousel) => {
    const id = idOf(row);
    if (!id) return;
    try {
      setBusyId(id);
      await updateMutation.mutateAsync({
        id,
        payload: {
          title: row.title,
          link: row.link,
          imageUrl: row.imageUrl,
          isActive: row.isActive,
          order: Number(row.order) || 0,
        },
      });
      toast.success('Carousel item updated.');
    } catch {
      toast.error('Failed to update item.');
    } finally {
      setBusyId(null);
    }
  };

  const removeRow = async (row: CmsCarousel) => {
    const id = idOf(row);
    if (!id) return;
    if (!window.confirm(`Delete "${row.title}"?`)) return;
    try {
      setBusyId(id);
      await deleteMutation.mutateAsync(id);
      toast.success('Carousel item deleted.');
    } catch {
      toast.error('Failed to delete item.');
    } finally {
      setBusyId(null);
    }
  };

  const move = async (row: CmsCarousel, dir: -1 | 1) => {
    const i = sorted.findIndex((x) => idOf(x) === idOf(row));
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    const a = sorted[i];
    const b = sorted[j];
    const aId = idOf(a);
    const bId = idOf(b);
    if (!aId || !bId) return;
    try {
      setBusyId(aId);
      await updateMutation.mutateAsync({
        id: aId,
        payload: { order: Number(b.order ?? j) },
      });
      await updateMutation.mutateAsync({
        id: bId,
        payload: { order: Number(a.order ?? i) },
      });
      toast.success('Order updated.');
    } catch {
      toast.error('Could not reorder.');
    } finally {
      setBusyId(null);
    }
  };

  const [localRows, setLocalRows] = useState<CmsCarousel[]>([]);
  const rows = localRows;


  useEffect(() => {
    // eslint-disable-next-line
    setLocalRows((prev) => {
      const next = sorted;
      if (prev.length !== next.length) return next;
      for (let i = 0; i < prev.length; i += 1) {
        const a = prev[i];
        const b = next[i];
        if (
          idOf(a) !== idOf(b) ||
          a.title !== b.title ||
          a.link !== b.link ||
          a.imageUrl !== b.imageUrl ||
          Boolean(a.isActive) !== Boolean(b.isActive) ||
          Number(a.order ?? 0) !== Number(b.order ?? 0)
        ) {
          return next;
        }
      }
      return prev;
    });
  }, [sorted]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-6">
        <h1 className="text-2xl font-bold">CMS Carousel Manager</h1>
        <p className="mt-1 text-sm text-slate-600">
          Admin creates content, backend stores it, marketplace consumes it.
        </p>
      </div>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 md:p-6">
        <h2 className="text-lg font-semibold">Create Carousel Item</h2>
        <p className="mt-1 text-xs text-slate-600">
          Recommended image size: 1920x640 (3:1), JPG/WEBP, and keep file size under ~500KB for faster loading.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-5">
          <input
            value={draft.title}
            onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
            placeholder="Title"
            className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2"
          />
          <input
            value={draft.link}
            onChange={(e) => setDraft((p) => ({ ...p, link: e.target.value }))}
            placeholder="/products or full URL"
            className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2"
          />
          <input
            type="number"
            value={draft.order}
            onChange={(e) => setDraft((p) => ({ ...p, order: e.target.value }))}
            placeholder="Order no."
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            value={draft.imageUrl}
            onChange={(e) => setDraft((p) => ({ ...p, imageUrl: e.target.value }))}
            placeholder="Image URL"
            className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-4"
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-col gap-1">
              <label
                className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm ${
                  uploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                }`}
              >
                {uploading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                    Uploading...
                  </span>
                ) : (
                  'Upload'
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadImage(file);
                    e.currentTarget.value = '';
                  }}
                />
              </label>
              <span className="text-xs text-slate-500">Best fit: 1920x640 (3:1)</span>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft((p) => ({ ...p, isActive: e.target.checked }))}
              />
              Active
            </label>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-600">Live preview (frontend look)</p>
          <div className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen bg-wm-page pt-4 pb-6 text-black sm:pt-6">
            <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
              <div className="relative mb-6 w-full min-w-0">
                <div className="w-full overflow-hidden rounded-xl border border-wm-border shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                  <article className="relative box-border shrink-0 overflow-hidden bg-neutral-900 h-[220px] md:h-[260px]">
                    {draft.imageUrl ? (
                      <img
                        src={draft.imageUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover object-center"
                        aria-hidden
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-300">
                        Upload an image to preview
                      </div>
                    )}
                    <div className="relative z-1 flex h-full flex-col justify-center px-5 py-6 sm:px-8 sm:py-8 md:max-w-[min(92%,540px)] md:pl-10 lg:pl-14 xl:pl-16">
                      <h3 className="mt-1 text-xl font-bold leading-snug tracking-tight text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.9),0_1px_3px_rgba(0,0,0,0.95)] sm:text-2xl md:text-[1.75rem] md:leading-snug">
                        {draft.title.trim() || 'Your carousel title'}
                      </h3>
                      <span className="mt-3 inline-flex w-max items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-md">
                        Shop now
                      </span>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void createCarousel()}
            disabled={createMutation.isPending || uploading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {createMutation.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-semibold">Carousel Items</h2>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
        {isLoading ? (
          <div className="p-6 text-sm text-slate-600">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">No carousel items found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Preview</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Link</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const id = idOf(row);
                  const busy = busyId === id;
                  return (
                    <tr key={id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={Number(row.order ?? 0)}
                          onChange={(e) =>
                            setLocalRows((prev) =>
                              prev.map((x) =>
                                idOf(x) === id ? { ...x, order: Number(e.target.value) || 0 } : x,
                              ),
                            )
                          }
                          className="w-20 rounded border border-slate-300 px-2 py-1.5"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <img
                          src={row.imageUrl}
                          alt={row.title}
                          className="h-12 w-20 rounded border border-slate-200 object-cover"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={row.title}
                          onChange={(e) =>
                            setLocalRows((prev) =>
                              prev.map((x) => (idOf(x) === id ? { ...x, title: e.target.value } : x)),
                            )
                          }
                          className="w-full rounded border border-slate-300 px-2 py-1.5"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={row.link}
                          onChange={(e) =>
                            setLocalRows((prev) =>
                              prev.map((x) => (idOf(x) === id ? { ...x, link: e.target.value } : x)),
                            )
                          }
                          className="w-full rounded border border-slate-300 px-2 py-1.5"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={Boolean(row.isActive)}
                          onChange={(e) =>
                            setLocalRows((prev) =>
                              prev.map((x) =>
                                idOf(x) === id ? { ...x, isActive: e.target.checked } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void move(row, -1)}
                            disabled={busy}
                            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-60"
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            onClick={() => void move(row, 1)}
                            disabled={busy}
                            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-60"
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            onClick={() => void saveRow(row)}
                            disabled={busy || updateMutation.isPending}
                            className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-60"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeRow(row)}
                            disabled={busy || deleteMutation.isPending}
                            className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700 disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
