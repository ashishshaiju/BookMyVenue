import type { CorsOptions } from 'cors';

function parseOrigins(env: string | undefined, fallback: string[]): string[] {
  if (!env) return fallback;
  const origins = env
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const o of origins) {
    const u = new URL(o);
    if (u.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
      throw new Error(`Non-HTTPS CORS origin in production: ${o}`);
    }
  }
  return origins;
}

export const corsOptions: CorsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? parseOrigins(process.env.CLIENT_URL, ['https://bookmyvenue.com'])
      : parseOrigins(process.env.CLIENT_URL, [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:5174',
          'http://localhost:3001',
        ]),
  credentials: true,
  optionsSuccessStatus: 204,
};
