export type CmsCarousel = {
  _id?: string;
  id?: string;
  title: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CmsCreateCarouselInput = {
  title: string;
  imageUrl: string;
  link: string;
  isActive?: boolean;
  order?: number;
};

export type CmsUpdateCarouselInput = Partial<CmsCreateCarouselInput>;

export type EventMosaicTile = {
  position: 'left' | 'centerTop' | 'centerBottomLeft' | 'centerBottomRight' | 'right';
  title: string;
  description?: string;
  eyebrow?: string;
  imageUrl: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type CmsPromoBanner = {
  _id?: string;
  id?: string;
  type: 'flash_banner' | 'event_mosaic' | 'category_image';
  slot: string;
  isActive: boolean;
  sortOrder: number;
  // flash banner fields
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
  // event mosaic fields
  eventHeadline?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  tiles?: EventMosaicTile[];
  createdAt?: string;
  updatedAt?: string;
};
