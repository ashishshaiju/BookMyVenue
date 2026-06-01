import type { CorsOptions } from 'cors';

export const corsOptions: CorsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? (process.env.CLIENT_URL ?? ['https://bookmyvenue.com'])
      : [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:5174',
          'http://localhost:3001',
        ],
  credentials: true,
  optionsSuccessStatus: 204,
};
