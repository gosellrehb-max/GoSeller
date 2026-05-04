import { Controller, Get, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiResponseHelper } from "./common/helpers/api-response.helper";
import { Response } from "express";

@Controller()
export class AppController {
  constructor(private readonly config: ConfigService) {}

  @Get("favicon.ico")
  favicon(@Res() res: Response) {
    res.status(204).end();
  }

  @Get("health")
  health() {
    return ApiResponseHelper.success(
      {
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: this.config.get<string>("nodeEnv"),
        version: this.config.get<string>("app.version"),
      },
      "Health check",
    );
  }

  @Get()
  apiInfo() {
    return ApiResponseHelper.success(
      {
        message: "🌟 GoSellr API - World's Best E-commerce Platform",
        version: "1.0.0",
        status: "Active",
        endpoints: {
          auth: "/api/auth",
          products: "/api/products",
          categories: "/api/categories",
          users: "/api/users",
          orders: "/api/orders",
          cart: "/api/cart",
          reviews: "/api/reviews",
          seller: "/api/seller",
          health: "/api/health",
        },
      },
      "API Information",
    );
  }
}
