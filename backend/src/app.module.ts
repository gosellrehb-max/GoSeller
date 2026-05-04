import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import configuration from "./config/configuration";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ProductsModule } from "./modules/products/products.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { CartModule } from "./modules/cart/cart.module";
import { WishlistModule } from "./modules/wishlist/wishlist.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { SellerModule } from "./modules/seller/seller.module";
import { SellerRegistrationModule } from "./modules/seller-registration/seller-registration.module";
import { RidersModule } from "./modules/riders/riders.module";
import { UploadModule } from "./modules/upload/upload.module";
import { EmailModule } from "./modules/email/email.module";
import { CmsModule } from "./modules/cms/cms.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [".env.local", ".env"],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>("mongodb.uri");
        if (!uri)
          throw new Error(
            "MONGODB_URI is not set. Add it to .env or environment.",
          );
        return {
          uri,
          ...config.get("mongodb.options"),
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    CartModule,
    WishlistModule,
    ReviewsModule,
    SellerModule,
    SellerRegistrationModule,
    RidersModule,
    CmsModule,
    UploadModule,
    EmailModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
