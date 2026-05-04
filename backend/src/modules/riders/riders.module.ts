import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Rider, RiderSchema } from './schemas/rider.schema';
import { RidersController } from './riders.controller';
import { RidersService } from './riders.service';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { EmailModule } from '../email/email.module';
import { VerificationModule } from '../verification/verification.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Rider.name, schema: RiderSchema }]),
    MulterModule.register({ storage: multer.memoryStorage() }),
    UploadModule,
    UsersModule,
    OrdersModule,
    EmailModule,
    VerificationModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('jwt.secret');
        if (!secret) throw new Error('JWT_SECRET must be set in environment variables.');
        return {
          secret,
          signOptions: { expiresIn: config.get<string>('jwt.expiresIn') ?? '8h' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [RidersController],
  providers: [RidersService],
  exports: [RidersService, MongooseModule],
})
export class RidersModule {}
