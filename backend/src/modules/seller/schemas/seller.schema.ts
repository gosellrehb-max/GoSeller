import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

/** Seller type – aligned with frontend (Company, Dealer, Wholesaler, Trader, Shopkeeper). */
export const SELLER_TYPES = ['Company', 'Dealer', 'Wholesaler', 'Trader', 'Shopkeeper'] as const;
export type SellerType = (typeof SELLER_TYPES)[number];

/** Pilot regions for seller operations (replaces legacy free-text business registered address). */
export const AREA_OF_DISTRIBUTION_VALUES = ['Islamabad', 'Rawalpindi'] as const;
export type AreaOfDistribution = (typeof AREA_OF_DISTRIBUTION_VALUES)[number];

@Schema({ timestamps: true })
export class Seller {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  /** Cached email for lookups/index; mirrors User.email. Kept in sync to satisfy unique index. */
  @Prop({ lowercase: true, trim: true })
  email?: string;

  @Prop({ required: true })
  businessName: string;

  @Prop({ enum: SELLER_TYPES, default: 'Shopkeeper' })
  type: string;

  @Prop({ default: 'pending' })
  status: string;

  @Prop({ default: false })
  verified: boolean;

  /** Registration / profile fields (aligned with frontend) */
  @Prop() phone?: string;
  @Prop() businessType?: string;
  @Prop() businessLicense?: string;
  /** One or more of Islamabad / Rawalpindi. Stored as array; Mixed allows legacy single-string documents until migrated. */
  @Prop({ type: MongooseSchema.Types.Mixed, default: [] })
  areaOfDistribution?: string[];
  /** @deprecated Replaced by areaOfDistribution; kept for existing MongoDB documents. */
  @Prop() businessAddress?: string;
  @Prop() city?: string;
  @Prop() state?: string;
  @Prop() zipCode?: string;
  @Prop() country?: string;
  /** Legacy free-text field; not used in new flows — prefer areaOfDistribution. */
  @Prop() distributionArea?: string;
  @Prop() authorizedTerritories?: string;
  @Prop({ type: Types.ObjectId, ref: 'Seller' }) parentCompanyId?: Types.ObjectId;
  @Prop() storeDescription?: string;
  /** Full address where riders pick up orders (may differ from registered business address). */
  @Prop({ trim: true })
  storePickupAddress?: string;
  @Prop() storeCategory?: string;
  @Prop() storeLogoUrl?: string;
  @Prop() storeBannerUrl?: string;
  @Prop({ type: [String], default: [] }) businessDocumentUrls?: string[];
  @Prop({ type: Object }) capabilities?: Record<string, boolean | string>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SellerSchema = SchemaFactory.createForClass(Seller);
export type SellerDocument = Seller & Document;

SellerSchema.index({ userId: 1 }, { unique: true });
SellerSchema.index({ email: 1 }, { sparse: true });
SellerSchema.index({ status: 1 });
