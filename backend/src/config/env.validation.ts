/**
 * Validates required env vars at startup (fail fast).
 * Used in production/Docker so missing config is caught immediately.
 *
 * Inventory mirrors `configuration.ts` and `.env.example`.
 */
function getEnv(key: string): string | undefined {
  return process.env[key];
}

export function validateEnv(): void {
  const nodeEnv = getEnv('NODE_ENV') ?? 'development';
  const isProduction = nodeEnv === 'production';

  const missing: string[] = [];

  if (isProduction) {
    if (!getEnv('MONGODB_URI')) {
      missing.push('MONGODB_URI is required');
    }
    if (!getEnv('JWT_SECRET')) {
      missing.push('JWT_SECRET is required for auth');
    }

    const smtpHost = getEnv('SMTP_HOST');
    const smtpUser = getEnv('SMTP_USER');
    const smtpPass = getEnv('SMTP_PASS');
    if (!smtpHost?.trim() || !smtpUser?.trim() || !smtpPass?.trim()) {
      missing.push(
        'SMTP_HOST, SMTP_USER, and SMTP_PASS are required in production (signup OTP and password reset use email)',
      );
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Configuration error:\n${missing.map((m) => `  - ${m}`).join('\n')}\nSet these in .env or environment. See backend/.env.example.`,
    );
  }
}
