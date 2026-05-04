import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailModule } from '../email/email.module';
import { VerificationService } from './verification.service';
import { EmailVerification, EmailVerificationSchema } from './schemas/email-verification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: EmailVerification.name, schema: EmailVerificationSchema }]),
    EmailModule,
  ],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
