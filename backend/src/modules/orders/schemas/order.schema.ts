import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0 })
  totalPrice: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seller: Types.ObjectId;

  @Prop({ enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'], default: 'pending' })
  status: string;

  @Prop({ trim: true })
  variantLabel?: string;
}

@Schema({ _id: false })
export class ShippingAddress {
  @Prop({ required: true }) firstName: string;
  @Prop({ required: true }) lastName: string;
  @Prop({ required: true }) email: string;
  @Prop({ required: true }) phone: string;
  @Prop({ type: Object, required: true }) address: { street: string; city: string; state: string; zipCode: string; country?: string };
}

@Schema({ _id: false })
export class PaymentInfo {
  @Prop({
    required: true,
    enum: [
      'credit_card',
      'debit_card',
      'paypal',
      'stripe',
      'crypto',
      'bank_transfer',
      'cash_on_delivery',
      'dummy',
      'jazzcash',
      'easypaisa',
    ],
  })
  method: string;

  @Prop({ enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'], default: 'pending' })
  status: string;

  @Prop() transactionId?: string;
  @Prop({ required: true, min: 0 }) amount: number;
  @Prop({ default: 'USD' }) currency: string;
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Order {
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customer: Types.ObjectId;

  @Prop({ type: [OrderItem], default: [] })
  items: OrderItem[];

  @Prop({
    enum: ['pending', 'confirmed', 'ready_for_delivery', 'picked', 'out_for_delivery', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'pending',
  })
  status: string;

  /** Set when a rider picks the order; picked orders are hidden from available list */
  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedRiderId?: Types.ObjectId;

  /** Who cancelled the order: 'customer' | 'seller'. Only set when status === 'cancelled'. */
  @Prop({ enum: ['customer', 'seller'], sparse: true })
  cancelledBy?: string;

  /** Optional free-text reason provided at cancellation time. */
  @Prop({ trim: true, default: '' })
  cancellationReason?: string;

  /** Future franchise integration: populated when franchise routing is enabled. */
  @Prop({ type: Types.ObjectId, ref: 'Franchise' })
  subFranchiseId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Franchise' })
  masterFranchiseId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Franchise' })
  corporateFranchiseId?: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ default: 0 })
  shippingCost: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ type: ShippingAddress })
  shippingAddress?: ShippingAddress;

  @Prop({ type: PaymentInfo })
  payment: PaymentInfo;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ customer: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ subFranchiseId: 1, status: 1 });
OrderSchema.index({ masterFranchiseId: 1, status: 1 });
OrderSchema.index({ corporateFranchiseId: 1, status: 1 });
export type OrderDocument = Order & Document;
