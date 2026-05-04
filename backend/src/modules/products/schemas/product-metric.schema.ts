import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductMetricType = 'view';

@Schema({ timestamps: true })
export class ProductMetric {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  product!: Types.ObjectId;

  @Prop({ required: true, enum: ['view'], index: true })
  type!: ProductMetricType;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductMetricSchema = SchemaFactory.createForClass(ProductMetric);
ProductMetricSchema.index({ product: 1, type: 1, createdAt: -1 });
ProductMetricSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 8 });
export type ProductMetricDocument = ProductMetric & Document;
