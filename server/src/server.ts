import 'dotenv/config';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import type { Express, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { corsOptions } from './configs/cors.config';
import { connectDatabase } from './configs/database.config';
import router from './router';
import { ResponseUtil } from './utils/responseUtils';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const app: Express = express();

// Trust the first proxy hop so express-rate-limit can read X-forwarded-For
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// CORS and cookies
app.use(cors(corsOptions));
app.use(cookieParser());

// Compression middleware
app.use(compression({ threshold: 1024 }));

// Cache control
app.use(express.static('public'));

app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Request logging
// [ ] TODO: Winston

// Router
// app.use('/health', healthRouter);
app.use('/api/v1', router);

// 404 Handler
app.use((_req: Request, res: Response) => {
  ResponseUtil.notFound(res, 'Route/Method not found');
});

// Global error handler
app.use((_req: Request, res: Response, _next: unknown) => {
  ResponseUtil.internalServerError(res, 'Internal server error');
});

// Start server
async function startServer(): Promise<void> {
  await connectDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Started on Port ${String(PORT)}`);
  });
}

void startServer();

// Graceful shutdown
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection', { reason });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
