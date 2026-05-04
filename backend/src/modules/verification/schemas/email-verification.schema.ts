import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class EmailVerification {
  @Prop({ required: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ required: true, enum: ['signup', 'password_reset'] })
  purpose: string;

  /** Set for signup flows; omitted for password reset. */
  @Prop({ required: false, enum: ['customer', 'seller', 'rider'] })
  role?: string;

  @Prop({ required: true })
  codeHash: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: false })
  consumed: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const EmailVerificationSchema = SchemaFactory.createForClass(EmailVerification);
EmailVerificationSchema.index({ email: 1, purpose: 1, role: 1 });
EmailVerificationSchema.index({ email: 1, purpose: 1 });
EmailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type EmailVerificationDocument = EmailVerification & Document;
