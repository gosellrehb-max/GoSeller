import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { ApiException } from '../../common/exceptions/api.exception';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
  ) {}

  async findOrCreate(userId: string): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!cart) {
      cart = new this.cartModel({ userId: new Types.ObjectId(userId), items: [] });
      await cart.save();
    }
    return cart;
  }

  async findByUserId(userId: string): Promise<CartDocument | null> {
    return this.cartModel.findOne({ userId: new Types.ObjectId(userId) }).populate('items.product').exec();
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
    price: number,
    variantKey = '',
    variantLabel = '',
  ): Promise<CartDocument> {
    const cart = await this.findOrCreate(userId);
    const items = cart.items || [];
    const key = variantKey ?? '';
    const label = variantLabel ?? '';
    const existing = items.find((i) => {
      const row = i as { product: Types.ObjectId; variantKey?: string };
      return row.product.toString() === productId && (row.variantKey ?? '') === key;
    });
    if (existing) {
      (existing as { quantity: number }).quantity += quantity;
    } else {
      items.push({
        product: new Types.ObjectId(productId),
        quantity,
        price,
        variantKey: key,
        variantLabel: label,
        addedAt: new Date(),
      } as never);
    }
    cart.items = items;
    await cart.save();
    return this.findByUserId(userId) as Promise<CartDocument>;
  }

  async updateItemQuantity(userId: string, itemId: string, quantity: number): Promise<CartDocument | null> {
    const cart = await this.findByUserId(userId);
    if (!cart) throw ApiException.notFound('Cart not found');
    const item = cart.items?.find((i) => (i as unknown as { _id: Types.ObjectId })._id?.toString() === itemId);
    if (!item) throw ApiException.notFound('Item not found');
    (item as { quantity: number }).quantity = quantity;
    await cart.save();
    return this.findByUserId(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<CartDocument | null> {
    const cart = await this.findByUserId(userId);
    if (!cart) throw ApiException.notFound('Cart not found');
    cart.items = cart.items?.filter((i) => (i as unknown as { _id: Types.ObjectId })._id?.toString() !== itemId) || [];
    await cart.save();
    return this.findByUserId(userId);
  }

  async clear(userId: string): Promise<CartDocument | null> {
    const cart = await this.findByUserId(userId);
    if (!cart) return null;
    cart.items = [];
    cart.appliedCoupon = undefined;
    await cart.save();
    return this.findByUserId(userId);
  }
}
