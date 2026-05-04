import { ApiException } from '../../common/exceptions/api.exception';
import type { UpsertPromoBannerDto } from './dto/cms-promo-banner.dto';
import {
  CMS_CATEGORY_PROMO_SLUGS,
  CMS_FLASH_PROMO_SLOTS,
} from './cms-promo.constants';
import type { CmsPromoBanner } from './schemas/promo-banner.schema';

const MOSAIC_POSITIONS = [
  'left',
  'centerTop',
  'centerBottomLeft',
  'centerBottomRight',
  'right',
] as const;

export function assertPromoSlotMatchesType(slot: string, type: string): void {
  if (type === 'flash_banner') {
    if (!CMS_FLASH_PROMO_SLOTS.includes(slot as (typeof CMS_FLASH_PROMO_SLOTS)[number])) {
      throw ApiException.badRequest(
        `Flash banners must use one of these slots: ${CMS_FLASH_PROMO_SLOTS.join(', ')}`,
      );
    }
    return;
  }
  if (type === 'category_image') {
    if (!CMS_CATEGORY_PROMO_SLUGS.includes(slot as (typeof CMS_CATEGORY_PROMO_SLUGS)[number])) {
      throw ApiException.badRequest('Unknown category slug for category_image promo');
    }
    return;
  }
  if (type === 'event_mosaic') {
    if (CMS_FLASH_PROMO_SLOTS.includes(slot as (typeof CMS_FLASH_PROMO_SLOTS)[number])) {
      throw ApiException.badRequest('Event mosaic slot cannot use a reserved flash banner slot id');
    }
    return;
  }
}

function assertEventMosaicTiles(dto: UpsertPromoBannerDto): void {
  if (dto.type !== 'event_mosaic' || dto.tiles == null) return;
  if (dto.tiles.length !== MOSAIC_POSITIONS.length) {
    throw ApiException.badRequest(`Event mosaic requires exactly ${MOSAIC_POSITIONS.length} tiles`);
  }
  const positions = new Set(dto.tiles.map((t) => t.position));
  for (const p of MOSAIC_POSITIONS) {
    if (!positions.has(p)) {
      throw ApiException.badRequest(`Event mosaic is missing tile position "${p}"`);
    }
  }
}

/** Builds a safe `$set` partial: only fields allowed for `dto.type` (no cross-type leakage). */
export function promoBannerPartialFromUpsertDto(dto: UpsertPromoBannerDto): Partial<CmsPromoBanner> {
  if (dto.type === 'category_image' && !dto.imageUrl?.trim()) {
    throw ApiException.badRequest('imageUrl is required for category_image promos');
  }

  assertEventMosaicTiles(dto);

  const base = {
    ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
  };

  if (dto.type === 'flash_banner') {
    const flash: Partial<CmsPromoBanner> = {
      ...base,
      ...(dto.sectionTitle !== undefined ? { sectionTitle: dto.sectionTitle } : {}),
      ...(dto.sectionSubtitle !== undefined ? { sectionSubtitle: dto.sectionSubtitle } : {}),
      ...(dto.mediaSide !== undefined ? { mediaSide: dto.mediaSide } : {}),
      ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
      ...(dto.eyebrow !== undefined ? { eyebrow: dto.eyebrow } : {}),
      ...(dto.headline !== undefined ? { headline: dto.headline } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.ctaLabel !== undefined ? { ctaLabel: dto.ctaLabel } : {}),
      ...(dto.ctaHref !== undefined ? { ctaHref: dto.ctaHref } : {}),
      ...(dto.priceNow !== undefined ? { priceNow: dto.priceNow } : {}),
      ...(dto.priceWas !== undefined ? { priceWas: dto.priceWas } : {}),
    };
    return flash;
  }

  if (dto.type === 'event_mosaic') {
    const mosaic: Partial<CmsPromoBanner> = {
      ...base,
      ...(dto.eventHeadline !== undefined ? { eventHeadline: dto.eventHeadline } : {}),
      ...(dto.startsAt !== undefined
        ? { startsAt: dto.startsAt === null || dto.startsAt === '' ? null : new Date(dto.startsAt) }
        : {}),
      ...(dto.endsAt !== undefined
        ? { endsAt: dto.endsAt === null || dto.endsAt === '' ? null : new Date(dto.endsAt) }
        : {}),
      ...(dto.tiles !== undefined ? { tiles: dto.tiles as CmsPromoBanner['tiles'] } : {}),
    };
    return mosaic;
  }

  // category_image
  const cat: Partial<CmsPromoBanner> = {
    ...base,
    ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
  };
  return cat;
}
