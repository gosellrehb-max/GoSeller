import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Seller, SellerSchema } from './schemas/seller.schema';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Seller.name, schema: SellerSchema }]),
    forwardRef(() => AuthModule),
    forwardRef(() => ProductsModule),
    OrdersModule,
  ],
  controllers: [SellerController],
  providers: [SellerService],
  exports: [SellerService, MongooseModule],
})
export class SellerModule {}
