import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter | null = null;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('smtp.host');
    const user = this.configService.get<string>('smtp.user');
    const pass = this.configService.get<string>('smtp.pass');
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>('smtp.port') ?? 587,
        secure: this.configService.get<boolean>('smtp.secure') ?? false,
        auth: { user, pass },
      });
    }
  }

  /** Send a single email. No-op if SMTP is not configured. */
  async sendMail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<boolean> {
    if (!this.transporter) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Email] SMTP not configured – skip send:', options.to, options.subject);
      }
      return false;
    }
    const from = this.configService.get<string>('smtp.from') ?? 'noreply@gosellr.com';
    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text ?? options.html?.replace(/<[^>]*>/g, '') ?? '',
        html: options.html,
      });
      return true;
    } catch (err) {
      console.error('[Email] Send failed:', err);
      return false;
    }
  }

  /**
   * Send welcome email after account creation.
   * Copy is tailored for customer (shop), seller (store dashboard), or rider (deliveries).
   */
  async sendWelcomeEmail(
    to: string,
    name: string,
    role: 'customer' | 'seller' | 'rider',
  ): Promise<boolean> {
    const appName = this.configService.get<string>('app.name') ?? 'GoSellr';
    const subject = `Welcome to ${appName} – Your account has been created`;

    const pendingNote =
      'If your account is pending admin approval, you will be able to log in once an administrator approves it.';

    let bodyText: string;
    let bodyHtml: string;

    switch (role) {
      case 'seller':
        bodyText = [
          `You registered as a seller on ${appName}.`,
          'Your seller account may be pending admin approval. Once approved, you can log in and manage your store from the seller dashboard.',
          pendingNote,
        ].join(' ');
        bodyHtml = `<p>You registered as a <strong>seller</strong> on <strong>${appName}</strong>.</p>
<p>Your seller account may be pending admin approval. Once approved, you can log in and manage your store from the <strong>seller dashboard</strong>.</p>
<p>${pendingNote}</p>`;
        break;
      case 'rider':
        bodyText = [
          `You registered as a delivery rider on ${appName}.`,
          'Your rider account may be pending admin approval. Once approved, you can sign in to the rider area to view assignments and update deliveries.',
          pendingNote,
        ].join(' ');
        bodyHtml = `<p>You registered as a <strong>delivery rider</strong> on <strong>${appName}</strong>.</p>
<p>Your rider account may be pending admin approval. Once approved, you can sign in to the <strong>rider portal</strong> to view assignments and update deliveries.</p>
<p>${pendingNote}</p>`;
        break;
      case 'customer':
      default:
        bodyText = [
          `You registered as a customer on ${appName}.`,
          'You can browse products, save items to your cart, and place orders once your account is active.',
          pendingNote,
        ].join(' ');
        bodyHtml = `<p>You registered as a <strong>customer</strong> on <strong>${appName}</strong>.</p>
<p>You can browse products, save items to your cart, and place orders once your account is active.</p>
<p>${pendingNote}</p>`;
        break;
    }

    const text = [
      `Hello ${name || 'there'},`,
      '',
      `Your ${appName} account has been created successfully.`,
      '',
      bodyText,
      '',
      'Thank you for joining us!',
      `The ${appName} Team`,
    ].join('\n');

    const html = [
      `<p>Hello ${name || 'there'},</p>`,
      `<p>Your <strong>${appName}</strong> account has been created successfully.</p>`,
      bodyHtml,
      '<p>Thank you for joining us!</p>',
      `<p>The ${appName} Team</p>`,
    ].join('');

    return this.sendMail({ to, subject, text, html });
  }
}
