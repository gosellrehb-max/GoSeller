import axios, { AxiosHeaders } from 'axios';
import type {
  CmsCarousel,
  CmsCreateCarouselInput,
  CmsUpdateCarouselInput,
  CmsPromoBanner,
  EventMosaicTile,
} from '@/features/cms/types/cms';
import { readAdminToken } from '@/lib/admin-session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

/** Mirrors backend `UpsertPromoBannerDto` — drops Mongo/server fields so ValidationPipe accept body */
function bodyForPromoUpsert(payload: Partial<CmsPromoBanner>): Record<string, unknown> {
  const keys = [
    'type',
    'isActive',
    'sortOrder',
    'sectionTitle',
    'sectionSubtitle',
    'mediaSide',
    'imageUrl',
    'eyebrow',
    'headline',
    'description',
    'ctaLabel',
    'ctaHref',
    'priceNow',
    'priceWas',
    'eventHeadline',
    'startsAt',
    'endsAt',
  ] as const satisfies readonly (keyof CmsPromoBanner)[];

  const body: Record<string, unknown> = {};
  for (const k of keys) {
    const v = payload[k];
    if (v !== undefined) body[k] = v;
  }

  if (payload.tiles !== undefined) {
    body.tiles = payload.tiles.map((tile) => mosaicTileForApi(tile));
  }

  return body;
}

function mosaicTileForApi(tile: EventMosaicTile): Record<string, unknown> {
  const out: Record<string, unknown> = {
    position: tile.position,
    title: tile.title,
    imageUrl: tile.imageUrl,
  };
  if (tile.description !== undefined) out.description = tile.description;
  if (tile.eyebrow !== undefined) out.eyebrow = tile.eyebrow;
  if (tile.ctaLabel !== undefined) out.ctaLabel = tile.ctaLabel;
  if (tile.ctaHref !== undefined) out.ctaHref = tile.ctaHref;
  return out;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = readAdminToken();
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

export const cmsApi = {
  getCarousels: async (): Promise<CmsCarousel[]> => {
    const res = await api.get('/cms/carousels/admin/all');
    const data = res.data?.data ?? res.data;
    return Array.isArray(data?.carousels) ? data.carousels : [];
  },

  createCarousel: async (payload: CmsCreateCarouselInput): Promise<CmsCarousel> => {
    const res = await api.post('/cms/carousels', payload);
    const data = res.data?.data ?? res.data;
    return data.carousel as CmsCarousel;
  },

  updateCarousel: async (id: string, payload: CmsUpdateCarouselInput): Promise<CmsCarousel> => {
    const res = await api.put(`/cms/carousels/${id}`, payload);
    const data = res.data?.data ?? res.data;
    return data.carousel as CmsCarousel;
  },

  deleteCarousel: async (id: string): Promise<void> => {
    await api.delete(`/cms/carousels/${id}`);
  },

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/upload/image', formData);
    const data = res.data?.data ?? res.data;
    return String(data?.url ?? '');
  },

  getPromoBanners: async (): Promise<CmsPromoBanner[]> => {
    const res = await api.get('/cms/promo-banners/admin/all');
    const data = res.data?.data ?? res.data;
    return Array.isArray(data?.banners) ? data.banners : [];
  },

  upsertPromoBanner: async (slot: string, payload: Partial<CmsPromoBanner>): Promise<CmsPromoBanner> => {
    const res = await api.put(`/cms/promo-banners/${slot}`, bodyForPromoUpsert(payload));
    const data = res.data?.data ?? res.data;
    return data.banner as CmsPromoBanner;
  },

  deletePromoBanner: async (id: string): Promise<void> => {
    await api.delete(`/cms/promo-banners/${id}`);
  },
};
