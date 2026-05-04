import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true })
  sellerId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  title!: string;

  @Prop({ unique: true, lowercase: true })
  slug?: string;

  @Prop({ required: true, maxlength: 2000 })
  description!: string;

  /** Long listing-style title for cards (e.g. SEO keywords); optional. */
  @Prop({ trim: true, maxlength: 2000 })
  detailedTitle?: string;

  @Prop({ maxlength: 200 })
  shortDescription?: string;

  @Prop({ required: true, enum: ['Grocery', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Books', 'Automotive', 'Health', 'Other'] })
  category!: string;

  @Prop({ trim: true })
  subcategory?: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  /** Seller product form sends discount % (0–100) in this field (legacy key). */
  @Prop({ min: 0 })
  originalPrice?: number;

  @Prop({ type: [String], required: true })
  images!: string[];

  @Prop({ required: true, min: 0, default: 0 })
  stock!: number;

  @Prop({ unique: true, sparse: true })
  sku?: string;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    default: [],
  })
  specifications?: Array<{ name: string; value: string }>;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        options: { type: [String], default: [] },
      },
    ],
    default: [],
  })
  variants?: Array<{ name: string; options: string[] }>;

  @Prop({ enum: ['pending', 'approved', 'rejected', 'draft'], default: 'pending' })
  status!: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isFeatured!: boolean;

  @Prop({ default: 0 })
  featuredPriority!: number;

  @Prop()
  featuredUntil?: Date;

  @Prop({ default: 0, index: true })
  trendingScore!: number;

  @Prop()
  trendingUpdatedAt?: Date;

  @Prop({ default: 0 })
  ordersLast24h!: number;

  @Prop({ default: 0 })
  viewsLast24h!: number;

  @Prop({ default: 0 })
  cartAddsLast24h!: number;

  @Prop({ default: 0 })
  wishlistLast24h!: number;

  @Prop({ default: 0 })
  views!: number;

  @Prop({ default: 0 })
  sales!: number;

  @Prop({
    type: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    default: { average: 0, count: 0 },
  })
  rating!: { average: number; count: number };

  /** Exact rider pickup location for this listing; overrides seller profile pickup when set. */
  @Prop({ trim: true, maxlength: 2000 })
  orderPickupLocation?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ sellerId: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ isFeatured: 1, featuredPriority: -1, featuredUntil: 1 });
ProductSchema.index({ trendingScore: -1, trendingUpdatedAt: -1 });
ProductSchema.index({ title: 'text', description: 'text', category: 'text' });
export type ProductDocument = Product & Document;
