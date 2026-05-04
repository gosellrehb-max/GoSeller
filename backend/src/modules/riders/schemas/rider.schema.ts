import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Rider {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: 'pending' })
  status: string;

  /** Required: rider's own details */
  @Prop({ required: true, trim: true })
  phone: string;
  @Prop({ required: true, trim: true })
  address: string;
  @Prop({ required: true, trim: true })
  idNumber: string;

  /** Uploaded CNIC / national ID image (URL). Required at registration. */
  @Prop({ trim: true })
  idCardDocumentUrl?: string;

  @Prop({ maxlength: 2000 }) personalNotes?: string;

  /** Optional: courier/delivery company (e.g. TCS, Leopards) */
  @Prop() courierCompanyName?: string;
  @Prop() courierCompanyBranch?: string;
  @Prop() courierEmployeeId?: string;
  @Prop() vehicleType?: string;
  @Prop({ maxlength: 2000 }) courierCompanyDetails?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RiderSchema = SchemaFactory.createForClass(Rider);
RiderSchema.index({ userId: 1 }, { unique: true });
export type RiderDocument = Rider & Document;
