'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { FlashInsertDefinition } from '@/config/flashInsertDefinitions';
import type { PromoEventBundle } from '@/config/promoEvents';
import { cmsQueryKeys } from '@/features/cms/queries/queryKeys';
import api from '@/services/api';

export type CmsPromoBannerRaw = {
  _id?: string;
  type: 'flash_banner' | 'event_mosaic' | 'category_image';
  slot: string;
  isActive: boolean;
  sortOrder: number;
  sectionTitle?: string;
  sectionSubtitle?: string;
  mediaSide?: 'left' | 'right';
  imageUrl?: string;
  eyebrow?: string;
  headline?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  priceNow?: number | null;
  priceWas?: number | null;
  eventHeadline?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  tiles?: {
    position: string;
    title: string;
    description?: string;
    eyebrow?: string;
    imageUrl: string;
    ctaLabel?: string;
    ctaHref?: string;
  }[];
};

async function fetchPromoBanners(): Promise<CmsPromoBannerRaw[]> {
  const res = await api.get<{ data: { banners: CmsPromoBannerRaw[] } }>('/cms/promo-banners');
  const payload = (res.data as any)?.data ?? res.data;
  return Array.isArray(payload?.banners) ? payload.banners : [];
}

export function useCmsPromoBanners() {
  return useQuery({
    queryKey: cmsQueryKeys.promoBanners,
    queryFn: fetchPromoBanners,
    staleTime: 60_000,  // 1 min — CMS data changes rarely but should be fresher than default
  });
}

/** Merges a CMS flash_banner record into a static FlashInsertDefinition (CMS wins on set fields) */
export function mergeFlashInsert(
  base: FlashInsertDefinition,
  cms: CmsPromoBannerRaw,
): FlashInsertDefinition {
  return {
    ...base,
    title: cms.sectionTitle?.trim() || base.title,
    subtitle: cms.sectionSubtitle?.trim() || base.subtitle,
    mediaSide: cms.mediaSide ?? base.mediaSide,
    banner: {
      ...base.banner,
      imageSrc: cms.imageUrl?.trim() || base.banner.imageSrc,
      eyebrow: cms.eyebrow?.trim() || base.banner.eyebrow,
      headline: cms.headline?.trim() || base.banner.headline,
      ctaLabel: cms.ctaLabel?.trim() || base.banner.ctaLabel,
      href: cms.ctaHref?.trim() || base.banner.href,
      priceNow: cms.priceNow ?? base.banner.priceNow,
      priceWas: cms.priceWas ?? base.banner.priceWas,
    },
  };
}

const TILE_DEFAULT_CLASSES: Record<string, { cardClassName: string; titleClassName: string }> = {
  left: { cardClassName: 'bg-gradient-to-br from-emerald-50 via-amber-50 to-rose-50 border border-emerald-100/80', titleClassName: 'text-[#0c2d26]' },
  centerTop: { cardClassName: 'bg-slate-50 border border-slate-100', titleClassName: 'text-slate-900' },
  centerBottomLeft: { cardClassName: 'bg-amber-50/80 border border-amber-100', titleClassName: 'text-slate-900' },
  centerBottomRight: { cardClassName: 'bg-pink-50 border border-pink-100', titleClassName: 'text-slate-900' },
  right: { cardClassName: 'bg-sky-50 border border-sky-100', titleClassName: 'text-[#041e42]' },
};

/**
 * Returns a slug → imageUrl map for category_image records.
 * Falls back to `CATEGORY_TILE_IMAGES` static map for any missing slug.
 */
export function buildCmsCategoryImageMap(
  banners: CmsPromoBannerRaw[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const b of banners) {
    if (b.type === 'category_image' && b.isActive && b.imageUrl?.trim()) {
      map[b.slot] = b.imageUrl.trim();
    }
  }
  return map;
}

/** Hook: returns slug → imageUrl map (CMS wins, falls back to GoSellrIcon) */
export function useCmsCategoryImages(): Record<string, string> {
  const { data: banners = [] } = useCmsPromoBanners();
  return useMemo(() => buildCmsCategoryImageMap(banners), [banners]);
}

/** Converts a CMS event_mosaic record into a PromoEventBundle */
export function cmsToPromoEventBundle(cms: CmsPromoBannerRaw): PromoEventBundle | null {
  const tilesMap = Object.fromEntries((cms.tiles ?? []).map((t) => [t.position, t]));

  const makeTile = (pos: string) => {
    const t = tilesMap[pos];
    const cls = TILE_DEFAULT_CLASSES[pos] ?? { cardClassName: 'bg-white border border-gray-100', titleClassName: 'text-slate-900' };
    return {
      title: t?.title || '',
      description: t?.description || undefined,
      eyebrow: t?.eyebrow || undefined,
      imageSrc: t?.imageUrl || '/images/GoSellrIcon.png',
      imageAlt: '',
      href: t?.ctaHref || '/products',
      ctaLabel: t?.ctaLabel || 'Shop now',
      cardClassName: cls.cardClassName,
      titleClassName: cls.titleClassName,
    };
  };

  return {
    id: cms.slot,
    enabled: cms.isActive,
    startsAt: cms.startsAt ?? undefined,
    endsAt: cms.endsAt ?? undefined,
    sortOrder: cms.sortOrder,
    headline: cms.eventHeadline || undefined,
    tiles: {
      left: makeTile('left'),
      centerTop: makeTile('centerTop'),
      centerBottomLeft: makeTile('centerBottomLeft'),
      centerBottomRight: makeTile('centerBottomRight'),
      right: makeTile('right'),
    },
  };
}
