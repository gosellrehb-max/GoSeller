import { Module, forwardRef } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { User, UserSchema } from "../users/schemas/user.schema";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UsersModule } from "../users/users.module";
import { SellerModule } from "../seller/seller.module";
import { CustomerModule } from "../customer/customer.module";
import { VerificationModule } from "../verification/verification.module";
import { RidersModule } from "../riders/riders.module";

@Module({
  imports: [
    UsersModule,
    forwardRef(() => SellerModule),
    CustomerModule,
    VerificationModule,
    RidersModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>("jwt.secret");
        if (!secret)
          throw new Error(
            "JWT_SECRET is not set. Add it to .env or environment.",
          );
        return {
          secret,
          signOptions: {
            expiresIn: config.get<string>("jwt.expiresIn") ?? "7d",
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
