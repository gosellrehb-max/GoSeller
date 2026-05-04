import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import * as multer from "multer";
import { SellerRegistrationController } from "./seller-registration.controller";
import { SellerRegistrationService } from "./seller-registration.service";
import { SellerModule } from "../seller/seller.module";
import { UploadModule } from "../upload/upload.module";
import { ProductsModule } from "../products/products.module";
import { OrdersModule } from "../orders/orders.module";

@Module({
  imports: [
    MulterModule.register({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
    SellerModule,
    UploadModule,
    ProductsModule,
    OrdersModule,
  ],
  controllers: [SellerRegistrationController],
  providers: [SellerRegistrationService],
})
export class SellerRegistrationModule {}
