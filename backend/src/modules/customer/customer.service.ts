import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { CartService } from '../cart/cart.service';
import {
  CheckoutPaymentInput,
  CheckoutShippingAddress,
  OrdersService,
} from '../orders/orders.service';
import { ApiException } from '../../common/exceptions/api.exception';
import { CustomerProfile, CustomerProfileDocument } from './schemas/customer.schema';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(CustomerProfile.name)
    private readonly customerProfileModel: Model<CustomerProfileDocument>,
    private readonly usersService: UsersService,
    private readonly cartService: CartService,
    private readonly ordersService: OrdersService,
  ) {}

  private sanitizeUser(user: { toObject?: () => Record<string, unknown> } | Record<string, unknown>) {
    const obj = 'toObject' in user && typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete (obj as Record<string, unknown>).password;
    return obj;
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw ApiException.notFound('Customer profile not found');
    const profile = await this.ensureProfile(userId);
    return {
      ...this.sanitizeUser(user as unknown as { toObject?: () => Record<string, unknown> }),
      customerProfile: profile,
    };
  }

  async updateProfile(
    userId: string,
    body: Partial<{ firstName: string; lastName: string; phone: string; emailVerified: boolean }>,
  ) {
    const user = await this.usersService.updateById(userId, body);
    const profile = await this.ensureProfile(userId, { phone: body.phone });
    return {
      ...this.sanitizeUser(user as unknown as { toObject?: () => Record<string, unknown> }),
      customerProfile: profile,
    };
  }

  async ensureProfile(userId: string, seed?: Partial<{ phone?: string }>) {
    if (!Types.ObjectId.isValid(userId)) {
      throw ApiException.badRequest('Invalid user id for customer profile.');
    }
    const existing = await this.customerProfileModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (existing) return existing;
    const created = new this.customerProfileModel({
      userId: new Types.ObjectId(userId),
      phone: seed?.phone,
      addresses: [],
      marketingOptIn: true,
    });
    return created.save();
  }

  async getCart(userId: string) {
    const existing = await this.cartService.findByUserId(userId);
    if (existing) return existing;
    return this.cartService.findOrCreate(userId);
  }

  async addCartItem(userId: string, productId: string, quantity?: number, price?: number) {
    if (!productId || !Types.ObjectId.isValid(productId)) {
      throw ApiException.badRequest('Valid productId is required.');
    }
    if (typeof price !== 'number' || Number.isNaN(price) || price < 0) {
      throw ApiException.badRequest('Valid price is required.');
    }
    return this.cartService.addItem(userId, productId, quantity ?? 1, price);
  }

  async updateCartItem(userId: string, itemId: string, quantity: number) {
    if (!itemId) throw ApiException.badRequest('itemId is required.');
    if (!Number.isFinite(quantity) || quantity < 1) {
      throw ApiException.badRequest('Quantity must be at least 1.');
    }
    return this.cartService.updateItemQuantity(userId, itemId, quantity);
  }

  async removeCartItem(userId: string, itemId: string) {
    if (!itemId) throw ApiException.badRequest('itemId is required.');
    return this.cartService.removeItem(userId, itemId);
  }

  async clearCart(userId: string) {
    return this.cartService.clear(userId);
  }

  async listOrders(userId: string, page = 1, limit = 20) {
    return this.ordersService.findAll(page, limit, userId);
  }

  async getOrder(userId: string, orderId: string) {
    const order = await this.ordersService.findById(orderId);
    if (!order) throw ApiException.notFound('Order not found');

    const customer = order.customer as { _id?: { toString(): string }; toString?: () => string } | undefined;
    const ownerId = customer?._id?.toString?.() ?? customer?.toString?.() ?? '';
    if (ownerId !== userId) {
      throw ApiException.forbidden('You can only view your own orders.');
    }
    return order;
  }

  async checkout(
    userId: string,
    shippingAddress: CheckoutShippingAddress,
    payment?: CheckoutPaymentInput,
  ) {
    return this.ordersService.checkout(userId, shippingAddress, payment);
  }

  async checkoutBuyNow(
    userId: string,
    shippingAddress: CheckoutShippingAddress,
    productId: string,
    quantity = 1,
    payment?: CheckoutPaymentInput,
  ) {
    return this.ordersService.checkoutBuyNow(userId, shippingAddress, productId, quantity, payment);
  }
}
