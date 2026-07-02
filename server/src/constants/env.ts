import type jwt from 'jsonwebtoken';

export const nodeEnv = process.env.NODE_ENV ?? 'development';

export const resendConfig = {
  apiKey: process.env.RESEND_API_KEY,
  fromName: process.env.EMAIL_FROM_NAME,
  fromEmail: process.env.EMAIL_FROM_EMAIL,
  devToEmail: process.env.RESEND_DEV_RECIPIENT,
  appName: process.env.APP_NAME ?? 'BookMyVenue',
  frontendUrl: process.env.FRONTEND_URL,
} as const;

export const jwtConfig = {
  issuer: process.env.JWT_ISSUER ?? 'BookMyVenue',
  audience: process.env.JWT_AUDIENCE ?? 'BookMyVenue',
  algorithm: (process.env.JWT_ALGORITHM ?? 'HS256') as jwt.Algorithm,
} as const;

export const razorpayConfig = {
  keyId: process.env.RAZORPAY_KEY_ID,
  keySecret: process.env.RAZORPAY_KEY_SECRET,
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
} as const;

export const authEnvs = {
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY ?? '60s',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY ?? '30m',
  accessTokenSecret: process.env.JWT_ACCESS_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
} as const;

export const swaggerConfig = {
  user: process.env.SWAGGER_USER ?? 'admin',
  pass: process.env.SWAGGER_PASS ?? 'swagger',
} as const;
