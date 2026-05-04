import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class CustomerAddress {
  @Prop() label?: string;
  @Prop() street?: string;
  @Prop() city?: string;
  @Prop() state?: string;
  @Prop() zipCode?: string;
  @Prop({ default: 'Pakistan' }) country?: string;
}

@Schema({ timestamps: true })
export class CustomerProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ type: [CustomerAddress], default: [] })
  addresses?: CustomerAddress[];

  @Prop({ default: true })
  marketingOptIn?: boolean;

  @Prop({ maxlength: 2000 })
  notes?: string;
}

export const CustomerProfileSchema = SchemaFactory.createForClass(CustomerProfile);
CustomerProfileSchema.index({ userId: 1 }, { unique: true });
export type CustomerProfileDocument = CustomerProfile & Document;
