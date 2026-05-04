'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productsApi, type AdminProduct } from '@/features/products/services/productsApi';

type FeaturedDraft = {
  isFeatured: boolean;
  featuredPriority: number;
  featuredUntil: string;
};

function productImage(product: AdminProduct): string {
  return product.imageUrl || product.images?.[0] || '/images/GoSellrIcon.png';
}

function toDateTimeLocal(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function draftFromProduct(product: AdminProduct): FeaturedDraft {
  return {
    isFeatured: Boolean(product.isFeatured),
    featuredPriority: Number(product.featuredPriority ?? 0),
    featuredUntil: toDateTimeLocal(product.featuredUntil),
  };
}

export default function FeaturedProductsManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('approved');
  const [drafts, setDrafts] = useState<Record<string, FeaturedDraft>>({});

  const queryKey = useMemo(
    () => ['admin-products', { search, status }],
    [search, status],
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => productsApi.list({ page: 1, limit: 80, search, status }),
  });

  const mutation = useMutation({
    mutationFn: ({
      id,
      draft,
    }: {
      id: string;
      draft: FeaturedDraft;
    }) =>
      productsApi.updateFeatured(id, {
        isFeatured: draft.isFeatured,
        featuredPriority: Number.isFinite(draft.featuredPriority) ? draft.featuredPriority : 0,
        featuredUntil: fromDateTimeLocal(draft.featuredUntil),
      }),
    onSuccess: async () => {
      toast.success('Featured settings saved');
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: () => {
      toast.error('Could not save featured settings');
    },
  });

  const products = data?.products ?? [];

  const getDraft = (product: AdminProduct) =>
    drafts[product._id] ?? draftFromProduct(product);

  const updateDraft = (id: string, update: Partial<FeaturedDraft>) => {
    const product = products.find((p) => p._id === id);
    if (!product) return;
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...getDraft(product), ...update },
    }));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Featured Products</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Control marketplace featured placement with `isFeatured`,
              `featuredPriority`, and `featuredUntil`. Higher priority appears first.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Product</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Trending</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Featured</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Featured Until</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const draft = getDraft(product);
                  return (
                    <tr key={product._id} className="align-middle">
                      <td className="px-4 py-3">
                        <div className="flex min-w-[260px] items-center gap-3">
                          <img
                            src={productImage(product)}
                            alt=""
                            className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{product.title}</p>
                            <p className="text-xs text-slate-500">
                              {product.category || 'Uncategorized'} · {product.status || 'unknown'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="font-semibold">{Number(product.trendingScore ?? 0)}</div>
                        <div className="text-xs text-slate-500">
                          O {product.ordersLast24h ?? 0} · V {product.viewsLast24h ?? 0} · C {product.cartAddsLast24h ?? 0} · W {product.wishlistLast24h ?? 0}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={draft.isFeatured}
                            onChange={(e) =>
                              updateDraft(product._id, { isFeatured: e.target.checked })
                            }
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          Live
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={draft.featuredPriority}
                          onChange={(e) =>
                            updateDraft(product._id, {
                              featuredPriority: Number(e.target.value || 0),
                            })
                          }
                          className="h-9 w-24 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="datetime-local"
                          value={draft.featuredUntil}
                          onChange={(e) =>
                            updateDraft(product._id, { featuredUntil: e.target.value })
                          }
                          className="h-9 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={mutation.isPending}
                          onClick={() => mutation.mutate({ id: product._id, draft })}
                          className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
