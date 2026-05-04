import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
import { CartAddItemDto, CartUpdateQuantityDto } from './dto/cart-mutation.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser() user: { id: string }) {
    const cart = await this.cartService.findByUserId(user.id);
    if (!cart) {
      const newCart = await this.cartService.findOrCreate(user.id);
      return ApiResponseHelper.success({ cart: newCart }, 'Cart retrieved successfully');
    }
    return ApiResponseHelper.success({ cart }, 'Cart retrieved successfully');
  }

  @Post('items')
  async addItem(
    @CurrentUser() user: { id: string },
    @Body() body: CartAddItemDto,
  ) {
    const cart = await this.cartService.addItem(
      user.id,
      body.productId,
      body.quantity ?? 1,
      body.price,
      typeof body.variantKey === 'string' ? body.variantKey : '',
      typeof body.variantLabel === 'string' ? body.variantLabel : '',
    );
    return ApiResponseHelper.success({ cart }, 'Item added to cart');
  }

  @Put('items/:itemId')
  async updateItem(
    @CurrentUser() user: { id: string },
    @Param('itemId') itemId: string,
    @Body() body: CartUpdateQuantityDto,
  ) {
    const cart = await this.cartService.updateItemQuantity(user.id, itemId, body.quantity);
    return ApiResponseHelper.success({ cart }, 'Cart updated');
  }

  @Delete('items/:itemId')
  async removeItem(@CurrentUser() user: { id: string }, @Param('itemId') itemId: string) {
    const cart = await this.cartService.removeItem(user.id, itemId);
    return ApiResponseHelper.success({ cart }, 'Item removed from cart');
  }

  @Delete()
  async clearCart(@CurrentUser() user: { id: string }) {
    const cart = await this.cartService.clear(user.id);
    return ApiResponseHelper.success({ cart }, 'Cart cleared');
  }
}
