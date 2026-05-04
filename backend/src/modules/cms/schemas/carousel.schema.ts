import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class CmsCarousel {
  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  imageUrl: string;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  link: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0, min: 0 })
  order: number;
}

export type CmsCarouselDocument = CmsCarousel & Document;
export const CmsCarouselSchema = SchemaFactory.createForClass(CmsCarousel);
CmsCarouselSchema.index({ isActive: 1, order: 1, createdAt: 1 });
