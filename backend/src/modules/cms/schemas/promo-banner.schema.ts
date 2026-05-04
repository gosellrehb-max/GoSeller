import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class EventMosaicTile {
  /** Mosaic position key */
  @Prop({ required: true, enum: ['left', 'centerTop', 'centerBottomLeft', 'centerBottomRight', 'right'] })
  position: string;

  @Prop({ required: true, maxlength: 200 })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  eyebrow: string;

  @Prop({ required: true, maxlength: 2000 })
  imageUrl: string;

  @Prop({ default: 'Shop now', maxlength: 80 })
  ctaLabel: string;

  @Prop({ default: '/products', maxlength: 2000 })
  ctaHref: string;
}

const EventMosaicTileSchema = SchemaFactory.createForClass(EventMosaicTile);

@Schema({ timestamps: true })
export class CmsPromoBanner {
  /** 'flash_banner' = FlashInsert section  |  'event_mosaic' = MarketplaceEventCards bundle  |  'category_image' = category tile art */
  @Prop({ required: true, enum: ['flash_banner', 'event_mosaic', 'category_image'] })
  type: string;

  /**
   * Flash banners: 'flash_after_discounts' | 'flash_after_get_it_all'
   * Event mosaics: any unique string, e.g. 'easter-spring'
   */
  @Prop({ required: true, trim: true, maxlength: 100 })
  slot: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0, min: 0 })
  sortOrder: number;

  /* ── Flash banner fields ───────────────────────────────────────────── */

  @Prop({ default: '', maxlength: 200 })
  sectionTitle: string;

  @Prop({ default: '', maxlength: 400 })
  sectionSubtitle: string;

  @Prop({ default: 'left', enum: ['left', 'right'] })
  mediaSide: string;

  @Prop({ default: '', maxlength: 2000 })
  imageUrl: string;

  @Prop({ default: '', maxlength: 120 })
  eyebrow: string;

  @Prop({ default: '', maxlength: 200 })
  headline: string;

  @Prop({ default: '', maxlength: 400 })
  description: string;

  @Prop({ default: 'Shop now', maxlength: 80 })
  ctaLabel: string;

  @Prop({ default: '/products', maxlength: 2000 })
  ctaHref: string;

  @Prop({ default: null, type: Number })
  priceNow: number | null;

  @Prop({ default: null, type: Number })
  priceWas: number | null;

  /* ── Event mosaic fields ───────────────────────────────────────────── */

  @Prop({ default: '', maxlength: 120 })
  eventHeadline: string;

  @Prop({ default: null, type: Date })
  startsAt: Date | null;

  @Prop({ default: null, type: Date })
  endsAt: Date | null;

  @Prop({ type: [EventMosaicTileSchema], default: [] })
  tiles: EventMosaicTile[];
}

export type CmsPromoBannerDocument = CmsPromoBanner & Document;
export const CmsPromoBannerSchema = SchemaFactory.createForClass(CmsPromoBanner);
CmsPromoBannerSchema.index({ type: 1, slot: 1 }, { unique: true });
CmsPromoBannerSchema.index({ isActive: 1, sortOrder: 1 });
