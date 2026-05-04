import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: true })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;

  /** Same product with different options = separate lines; empty string = no variant selection. */
  @Prop({ type: String, default: '' })
  variantKey?: string;

  /** Human-readable e.g. "Size: Small · Color: Red" for cart/checkout UI. */
  @Prop({ type: String, default: '' })
  variantLabel?: string;

  @Prop({ default: Date.now })
  addedAt: Date;
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: [CartItem], default: [] })
  items: CartItem[];

  @Prop({ type: Object })
  appliedCoupon?: { code: string; discountType: string; discountValue: number; discount: number };

  createdAt?: Date;
  updatedAt?: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
CartSchema.index({ userId: 1 });
export type CartDocument = Cart & Document;
