import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../email/email.service';
import { ApiException } from '../../common/exceptions/api.exception';
import { EmailVerification, EmailVerificationDocument } from './schemas/email-verification.schema';

type SignupRole = 'customer' | 'seller' | 'rider';

@Injectable()
export class VerificationService {
  constructor(
    @InjectModel(EmailVerification.name)
    private readonly verificationModel: Model<EmailVerificationDocument>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  private normalizeEmail(email: string) {
    return email.toLowerCase().trim();
  }

  private generateCode(length = 6) {
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
  }

  async sendSignupCode(email: string, role: SignupRole) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) throw ApiException.badRequest('Email is required.');

    const ttlMinutes = this.configService.get<number>('auth.verificationCodeTtlMinutes') ?? 10;
    const codeLength = this.configService.get<number>('auth.verificationCodeLength') ?? 6;
    const code = this.generateCode(codeLength);
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.verificationModel.deleteMany({
      email: normalizedEmail,
      purpose: 'signup',
      role,
    });

    await this.verificationModel.create({
      email: normalizedEmail,
      purpose: 'signup',
      role,
      codeHash,
      expiresAt,
      attempts: 0,
      consumed: false,
    });

    const appName = this.configService.get<string>('app.name') ?? 'GoSellr';
    const sent = await this.emailService.sendMail({
      to: normalizedEmail,
      subject: `${appName} verification code`,
      text: [
        `Your ${appName} verification code is ${code}.`,
        `It expires in ${ttlMinutes} minute(s).`,
        'If you did not request this code, you can ignore this email.',
      ].join(' '),
      html: [
        `<p>Your <strong>${appName}</strong> verification code is:</p>`,
        `<p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${code}</p>`,
        `<p>This code expires in <strong>${ttlMinutes} minute(s)</strong>.</p>`,
        '<p>If you did not request this code, you can ignore this email.</p>',
      ].join(''),
    });

    return {
      email: normalizedEmail,
      role,
      expiresAt,
      sent,
      message: sent
        ? 'Verification code sent successfully.'
        : 'Verification code was generated, but email delivery is not configured.',
    };
  }

  async consumeSignupCode(email: string, role: SignupRole, code: string) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!code?.trim()) throw ApiException.badRequest('Verification code is required.');

    const record = await this.verificationModel
      .findOne({
        email: normalizedEmail,
        purpose: 'signup',
        role,
        consumed: false,
      })
      .sort({ createdAt: -1 })
      .exec();

    if (!record) {
      throw ApiException.badRequest('No verification code found for this email. Request a new code first.');
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw ApiException.badRequest('Verification code has expired. Request a new code.');
    }
    if (record.attempts >= 5) {
      throw ApiException.tooManyRequests('Too many invalid attempts. Request a new verification code.');
    }

    const matches = await bcrypt.compare(code.trim(), record.codeHash);
    if (!matches) {
      record.attempts += 1;
      await record.save();
      throw ApiException.badRequest('Invalid verification code.');
    }

    record.consumed = true;
    await record.save();
  }

  async sendPasswordResetCode(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) throw ApiException.badRequest('Email is required.');

    const ttlMinutes = this.configService.get<number>('auth.verificationCodeTtlMinutes') ?? 10;
    const codeLength = this.configService.get<number>('auth.verificationCodeLength') ?? 6;
    const code = this.generateCode(codeLength);
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.verificationModel.deleteMany({
      email: normalizedEmail,
      purpose: 'password_reset',
    });

    await this.verificationModel.create({
      email: normalizedEmail,
      purpose: 'password_reset',
      codeHash,
      expiresAt,
      attempts: 0,
      consumed: false,
    });

    const appName = this.configService.get<string>('app.name') ?? 'GoSellr';
    const sent = await this.emailService.sendMail({
      to: normalizedEmail,
      subject: `${appName} password reset code`,
      text: [
        `Your ${appName} password reset code is ${code}.`,
        `It expires in ${ttlMinutes} minute(s).`,
        'If you did not request a password reset, you can ignore this email.',
      ].join(' '),
      html: [
        `<p>Your <strong>${appName}</strong> password reset code is:</p>`,
        `<p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${code}</p>`,
        `<p>This code expires in <strong>${ttlMinutes} minute(s)</strong>.</p>`,
        '<p>If you did not request a password reset, you can ignore this email.</p>',
      ].join(''),
    });

    return {
      email: normalizedEmail,
      expiresAt,
      sent,
      message: sent
        ? 'If an account exists for this email, we sent a password reset code.'
        : 'Password reset code was generated, but email delivery is not configured.',
    };
  }

  async consumePasswordResetCode(email: string, code: string) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!code?.trim()) throw ApiException.badRequest('Verification code is required.');

    const record = await this.verificationModel
      .findOne({
        email: normalizedEmail,
        purpose: 'password_reset',
        consumed: false,
      })
      .sort({ createdAt: -1 })
      .exec();

    if (!record) {
      throw ApiException.badRequest('No password reset code found for this email. Request a new code first.');
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw ApiException.badRequest('Verification code has expired. Request a new code.');
    }
    if (record.attempts >= 5) {
      throw ApiException.tooManyRequests('Too many invalid attempts. Request a new verification code.');
    }

    const matches = await bcrypt.compare(code.trim(), record.codeHash);
    if (!matches) {
      record.attempts += 1;
      await record.save();
      throw ApiException.badRequest('Invalid verification code.');
    }

    record.consumed = true;
    await record.save();
  }
}
