import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true })
  productId!: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false })
  orderId?: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating!: number;

  @Prop({ required: true, minlength: 10, maxlength: 2000 })
  comment!: string;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ default: true })
  isVerifiedPurchase!: boolean;

  @Prop({ default: true })
  isActive!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
// Unique compound index: one review per user per product
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
// Index for finding reviews by product
ReviewSchema.index({ productId: 1, isActive: 1 });
// Index for finding reviews by user
ReviewSchema.index({ userId: 1 });
// Index for sorting by creation
ReviewSchema.index({ createdAt: -1 });

export type ReviewDocument = Review & Document;
