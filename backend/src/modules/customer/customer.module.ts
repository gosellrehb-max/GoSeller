import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CustomerService } from "./customer.service";
import { UsersModule } from "../users/users.module";
import { CartModule } from "../cart/cart.module";
import { OrdersModule } from "../orders/orders.module";
import {
  CustomerProfile,
  CustomerProfileSchema,
} from "./schemas/customer.schema";

@Module({
  imports: [
    UsersModule,
    CartModule,
    OrdersModule,
    MongooseModule.forFeature([
      { name: CustomerProfile.name, schema: CustomerProfileSchema },
    ]),
  ],
  providers: [CustomerService],
  exports: [CustomerService, MongooseModule],
})
export class CustomerModule {}
