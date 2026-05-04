import { NestFactory } from "@nestjs/core";
import { AppModule } from "./src/app.module";
import { OrdersService } from "./src/modules/orders/orders.service";
import { Order } from "./src/modules/orders/schemas/order.schema";
import { Model } from "mongoose";
import { getModelToken } from "@nestjs/mongoose";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const orderModel = app.get<Model<Order>>(getModelToken(Order.name));

  const allOrders = await orderModel.find({}).sort({ createdAt: -1 }).lean();
  console.log("All Orders Count:", allOrders.length);
  if (allOrders.length > 0) {
    console.log("Recent 3 Orders Statuses:");
    allOrders.slice(0, 3).forEach((o, i) => {
      console.log(
        `[${i}] Status: ${o.status}, Rider: ${o.assignedRiderId}, Date: ${o.createdAt}`,
      );
    });
  }

  const query = {
    status: {
      $in: ["pending", "confirmed", "processing", "ready_for_delivery"],
    },
    $or: [{ assignedRiderId: null }, { assignedRiderId: { $exists: false } }],
  };
  const availableOrders = await orderModel.find(query).lean();
  console.log("\nAvailable Orders (Rider query):", availableOrders.length);

  await app.close();
}
bootstrap();
