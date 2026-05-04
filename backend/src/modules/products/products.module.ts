import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Product, ProductSchema } from "./schemas/product.schema";
import { ProductMetric, ProductMetricSchema } from "./schemas/product-metric.schema";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { ProductsSearchCacheService } from "./products-search-cache.service";
import { SellerModule } from "../seller/seller.module";
import { Order, OrderSchema } from "../orders/schemas/order.schema";
import { Cart, CartSchema } from "../cart/schemas/cart.schema";
import { Wishlist, WishlistSchema } from "../wishlist/schemas/wishlist.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductMetric.name, schema: ProductMetricSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Wishlist.name, schema: WishlistSchema },
    ]),
    forwardRef(() => SellerModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsSearchCacheService],
  exports: [ProductsService, MongooseModule],
})
export class ProductsModule {}
