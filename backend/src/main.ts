import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { validateEnv } from './config/env.validation';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression');
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const port = config.get<number>('port') ?? 5000;
  const apiPrefix = config.get<string>('apiPrefix') ?? 'api';
  const nodeEnv = config.get<string>('nodeEnv') ?? 'development';
  const corsConfig = config.get<{ origin: string; methods: string[]; allowedHeaders: string[] }>('cors');

  app.setGlobalPrefix(apiPrefix, { exclude: ['favicon.ico'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  );
  const prefixedPath = (path: string) => {
    const prefix = apiPrefix.replace(/^\/|\/$/g, '');
    return prefix ? `/${prefix}${path}` : path;
  };
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
    },
  });
  const codeLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many verification code requests. Please try again later.',
    },
  });
  app.use(
    [
      prefixedPath('/auth/register/send-code'),
      prefixedPath('/auth/register/check-email'),
      prefixedPath('/auth/forgot-password/send-code'),
      prefixedPath('/riders/register/send-code'),
      prefixedPath('/riders/register/check-email'),
    ],
    codeLimiter,
  );
  app.use(
    [
      prefixedPath('/auth/login'),
      prefixedPath('/auth/register'),
      prefixedPath('/auth/forgot-password/reset'),
      prefixedPath('/riders/register'),
      prefixedPath('/seller/login'),
    ],
    authLimiter,
  );
  app.use(compression());
  app.enableCors(corsConfig ?? { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'] });

  await app.listen(port);

  console.log('🌟 GoSellr Backend (NestJS) Started Successfully!');
  console.log('================================================');
  console.log(`🚀 Server running on port: ${port}`);
  console.log(`🌍 Environment: ${nodeEnv}`);
  console.log(`🔗 API: /${apiPrefix}`);
  console.log('================================================');
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
