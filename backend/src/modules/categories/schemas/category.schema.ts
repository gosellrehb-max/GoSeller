import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ unique: true, lowercase: true })
  slug?: string;

  @Prop({ maxlength: 500 })
  description?: string;

  @Prop({ default: '📦' })
  icon: string;

  @Prop()
  image?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  parentId?: Types.ObjectId | null;

  @Prop({ default: 1, min: 1, max: 3 })
  level: number;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: 0 })
  productCount: number;

  @Prop({ default: 0 })
  viewCount: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parentId: 1 });
export type CategoryDocument = Category & Document;
