import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
import { ApiException } from '../../common/exceptions/api.exception';
import { CheckoutShippingAddress, CheckoutPaymentInput } from './orders.service';
import { CheckoutDto, BuyNowDto, UpdateOrderStatusDto, CancelOrderDto } from './dto/checkout.dto';
import { AdminCreateOrderDto } from './dto/admin-create-order.dto';
import {
  hasActiveRole,
  hasAdminGrant,
  hasAnyGrantedRole,
} from '../../common/auth/request-user.roles';

function getRequestUserId(user?: { id?: string; _id?: { toString(): string } } | null): string | undefined {
  if (!user) return undefined;
  const id = user.id ?? user._id?.toString?.();
  return id || undefined;
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  private parseCheckoutPayment(p?: { method?: string; reference?: string }): CheckoutPaymentInput | undefined {
    if (!p?.method) return undefined;
    const allowed: CheckoutPaymentInput['method'][] = ['cod', 'card', 'jazzcash', 'easypaisa'];
    if (!allowed.includes(p.method as CheckoutPaymentInput['method'])) {
      throw ApiException.badRequest(`Invalid payment method. Allowed: ${allowed.join(', ')}`);
    }
    return {
      method: p.method as CheckoutPaymentInput['method'],
      reference: typeof p.reference === 'string' ? p.reference : undefined,
    };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: { id: string; role: string },
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;

    if (hasActiveRole(user, 'rider')) {
      const result = await this.ordersService.findAllForRider(p, l, getRequestUserId(user));
      return ApiResponseHelper.success(
        {
          orders: result.orders,
          pagination: { current: result.page, pages: result.pages, total: result.total, limit: result.limit },
        },
        'Rider orders retrieved successfully',
      );
    }

    if (hasActiveRole(user, 'seller')) {
      const result = await this.ordersService.findAllForSeller(p, l, getRequestUserId(user));
      return ApiResponseHelper.success(
        {
          orders: result.orders,
          pagination: { current: result.page, pages: result.pages, total: result.total, limit: result.limit },
        },
        'Seller orders retrieved successfully',
      );
    }

    const customerId =
      hasAdminGrant(user) ? undefined : getRequestUserId(user);
    const result = await this.ordersService.findAll(p, l, customerId);
    return ApiResponseHelper.success(
      { orders: result.orders, pagination: { current: result.page, pages: result.pages, total: result.total } },
      'Orders retrieved successfully',
    );
  }

  /** Seller-only: buyers who ordered this store's products (aggregated from orders). */
  @Get('seller/customers')
  async getSellerCustomers(@CurrentUser() user?: { id: string; role: string; roles?: string[] }) {
    if (!hasAnyGrantedRole(user, ['seller'])) {
      throw ApiException.forbidden('Only sellers can view store customers.');
    }
    const result = await this.ordersService.getCustomersForSeller(getRequestUserId(user));
    return ApiResponseHelper.success(result, 'Customers retrieved successfully');
  }

  /** Seller-only: revenue, orders, trends, top products (your lines only). */
  @Get('seller/analytics')
  async getSellerAnalytics(
    @Query('period') period?: string,
    @CurrentUser() user?: { id: string; role: string; roles?: string[] },
  ) {
    if (!hasAnyGrantedRole(user, ['seller'])) {
      throw ApiException.forbidden('Only sellers can view store analytics.');
    }
    const result = await this.ordersService.getAnalyticsForSeller(getRequestUserId(user), period);
    return ApiResponseHelper.success(result, 'Analytics retrieved successfully');
  }

  @Post('checkout')
  async checkout(
    @Body() dto: CheckoutDto,
    @CurrentUser() user: { id?: string; _id?: { toString(): string }; role: string },
  ) {
    if (
      !hasAnyGrantedRole(user, ['customer', 'admin', 'super-admin'])
    ) {
      throw ApiException.forbidden('Only customers can checkout.');
    }
    const customerId = user.id ?? user._id?.toString?.();
    if (!customerId) throw ApiException.badRequest('Invalid session: missing user id.');
    const payment = dto.payment
      ? this.parseCheckoutPayment(dto.payment)
      : undefined;
    const order = await this.ordersService.checkout(
      customerId,
      dto.shippingAddress as CheckoutShippingAddress,
      payment,
    );
    return ApiResponseHelper.success({ order }, 'Checkout successful. Order placed.', 201);
  }

  /** Buy now: single product + quantity, no cart required */
  @Post('checkout/buy-now')
  async checkoutBuyNow(
    @Body() dto: BuyNowDto,
    @CurrentUser() user: { id?: string; _id?: { toString(): string }; role: string },
  ) {
    if (
      !hasAnyGrantedRole(user, ['customer', 'admin', 'super-admin'])
    ) {
      throw ApiException.forbidden('Only customers can checkout.');
    }
    const customerId = user.id ?? user._id?.toString?.();
    if (!customerId) throw ApiException.badRequest('Invalid session: missing user id.');
    const payment = dto.payment ? this.parseCheckoutPayment(dto.payment) : undefined;
    const order = await this.ordersService.checkoutBuyNow(
      customerId,
      dto.shippingAddress as CheckoutShippingAddress,
      dto.productId.trim(),
      dto.quantity ?? 1,
      payment,
      dto.variantLabel,
    );
    return ApiResponseHelper.success({ order }, 'Order placed successfully.', 201);
  }

  @Patch(':id')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    if (!hasAdminGrant(user) && !hasAnyGrantedRole(user, ['rider'])) {
      throw ApiException.forbidden('Only admin or rider can update order status.');
    }
    const order = await this.ordersService.updateOrderStatus(id, dto, user);
    return ApiResponseHelper.success({ order }, 'Order updated successfully');
  }

  /** Customer or seller cancels an order (before a rider picks it up). */
  @Post(':id/cancel')
  async cancelOrder(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: { id: string; role: string; roles?: string[] },
  ) {
    const isCustomer = hasAnyGrantedRole(user, ['customer']);
    const isSeller = hasAnyGrantedRole(user, ['seller']);
    if (!isCustomer && !isSeller) {
      throw ApiException.forbidden('Only customers and sellers can cancel orders.');
    }
    const cancelledBy: 'customer' | 'seller' = hasActiveRole(user, 'seller')
      ? 'seller'
      : 'customer';
    const order = await this.ordersService.cancelOrder(id, cancelledBy, user.id, dto.reason);
    return ApiResponseHelper.success({ order }, 'Order cancelled successfully.');
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user?: { id: string; role: string }) {
    const order = await this.ordersService.findById(id);
    if (!order) throw ApiException.notFound('Order not found');
    const cust = (order as { customer: { _id?: { toString(): string }; toString?: () => string } }).customer;
    const customerId = cust && typeof cust === 'object' && (cust as { _id?: unknown })._id
      ? (cust as { _id: { toString(): string } })._id.toString()
      : (cust as { toString?: () => string })?.toString?.();
    const isOwn = getRequestUserId(user) === customerId;
    const isAdmin = hasAdminGrant(user);
    const assigned = (order as { assignedRiderId?: { toString(): string } | null }).assignedRiderId;
    const assignedRiderIdStr = assigned ? assigned.toString() : '';
    const isAssignedRider =
      hasAnyGrantedRole(user, ['rider']) &&
      !!assignedRiderIdStr &&
      getRequestUserId(user) === assignedRiderIdStr;
    if (!isOwn && !isAdmin && !isAssignedRider) {
      throw ApiException.forbidden('You can only view your own orders.');
    }
    return ApiResponseHelper.success({ order }, 'Order retrieved successfully');
  }

  /** Admin-only direct order creation (internal tooling / backfills). */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'super-admin')
  async create(@Body() dto: AdminCreateOrderDto, @CurrentUser() user: { id: string }) {
    const plain = instanceToPlain(dto);
    const order = await this.ordersService.create({
      ...plain,
      customer: user.id,
    } as never);
    return ApiResponseHelper.created({ order }, 'Order created successfully');
  }
}
