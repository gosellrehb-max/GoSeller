import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { Rider, RiderSchema } from '../riders/schemas/rider.schema';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SellerOrderInsightsService } from './seller-order-insights.service';
import { OrderCheckoutService } from './order-checkout.service';
import { OrderLifecycleService } from './order-lifecycle.service';
import { CartModule } from '../cart/cart.module';
import { ProductsModule } from '../products/products.module';
import { SellerModule } from '../seller/seller.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Rider.name, schema: RiderSchema },
    ]),
    CartModule,
    ProductsModule,
    forwardRef(() => SellerModule),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    SellerOrderInsightsService,
    OrderCheckoutService,
    OrderLifecycleService,
  ],
  exports: [OrdersService, MongooseModule],
})
export class OrdersModule {}
