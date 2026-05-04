/**
 * Central application configuration.
 * All env-based config lives here. No hardcoded ports, DB URLs, or secrets in app code.
 * Defaults are for local development only; production must set env vars (e.g. in Docker).
 */
export default () => ({
  // Server
  port: parseInt(process.env.PORT ?? '5000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiPrefix: process.env.API_PREFIX ?? 'api',

  // Database – dev default only; production must set MONGODB_URI
  mongodb: {
    uri:
      process.env.MONGODB_URI ??
      (process.env.NODE_ENV === 'production' ? undefined : 'mongodb://localhost:27017/gosellr'),
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE ?? '10', 10),
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_TIMEOUT_MS ?? '5000', 10),
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS ?? '45000', 10),
    },
  },

  // JWT – dev default only; production must set JWT_SECRET
  jwt: {
    secret:
      process.env.JWT_SECRET ??
      (process.env.NODE_ENV === 'production' ? undefined : 'dev-jwt-secret-change-in-production'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },

  // App display name (emails, health, etc.). Use APP_NAME to override (avoid "… API" in customer-facing text).
  app: {
    name: process.env.APP_NAME ?? 'GoSellr',
    version: process.env.APP_VERSION ?? process.env.npm_package_version ?? '1.0.0',
  },

  // CORS – allow override
  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },

  // Cloudinary – image upload (Phase 2)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER ?? 'goseller',
  },

  // SMTP – email (e.g. welcome on registration)
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'noreply@gosellr.com',
    secure: process.env.SMTP_SECURE === 'true',
  },

  // Auth – identity source (for future IdP integration)
  auth: {
    /** 'local' = email/password only; when IdP is ready, can add 'idp' or use IDP_ENABLED. */
    authSource: process.env.AUTH_SOURCE ?? 'local',
    /** When true, frontend can show "Login with central profile" and redirect to IdP. Backend reserves /auth/idp/* for callback. */
    idpEnabled: process.env.IDP_ENABLED === 'true',
    /** Base URL of the central verification system (IdP) – used when IDP_ENABLED is true. */
    idpBaseUrl: process.env.IDP_BASE_URL,
    /** Our callback URL for IdP (e.g. https://api.goseller.com/api/auth/idp/callback). */
    idpCallbackPath: process.env.IDP_CALLBACK_PATH ?? '/api/auth/idp/callback',
    /**
     * When true, customer/seller/rider accounts start as `pending` and cannot log in until approved.
     * When false, accounts are created as `active` immediately.
     */
    requireAdminApproval: (process.env.REQUIRE_ADMIN_APPROVAL ?? 'true') === 'true',
    verificationCodeTtlMinutes: parseInt(process.env.VERIFICATION_CODE_TTL_MINUTES ?? '10', 10),
    verificationCodeLength: parseInt(process.env.VERIFICATION_CODE_LENGTH ?? '6', 10),
  },

  /**
   * Product catalog & approval — seller/customer storefronts often skip admin product gates.
   * DISABLE_PRODUCT_ADMIN_APPROVAL=true → new products are `approved` immediately (no pending notification).
   * HIDE_PRODUCT_CATALOG_FOR_SELLERS=true → logged-in sellers do not receive marketplace listings (GET list/detail).
   */
  products: {
    disableAdminApproval: (process.env.DISABLE_PRODUCT_ADMIN_APPROVAL ?? 'true') === 'true',
    hideCatalogForSellers: (process.env.HIDE_PRODUCT_CATALOG_FOR_SELLERS ?? 'true') === 'true',
    searchCacheTtlSeconds: parseInt(process.env.PRODUCT_SEARCH_CACHE_TTL_SECONDS ?? '45', 10),
  },

  // Feature flags – keep future modules isolated until rollout.
  features: {
    franchiseEnabled: (process.env.ENABLE_FRANCHISE ?? 'false') === 'true',
  },

  // Redis – optional; product search cache uses it when set (falls back to in-memory TTL cache).
  redis: {
    url: process.env.REDIS_URL?.trim() || undefined,
  },
});
