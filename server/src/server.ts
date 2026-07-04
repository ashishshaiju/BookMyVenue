import 'dotenv/config';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import type { Express, NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import type { Server } from 'http';

import { corsOptions } from './configs/cors.config';
import { connectDatabase } from './configs/database.config';
import { validateEnv } from './configs/envValidation.config';
import router from './router';
import { ResponseUtil } from './utils/responseUtils';
import { validateEmailConfig } from './services/email.service';
import { startEmailWorker } from './workers/email.worker';
import { setupGracefulShutdown } from './utils/shutdownUtils';
import { requestLogger, logInfo, logError } from './utils/logger';
import { webhookRouter } from './modules/webhook/webhook.router';
import { verifyRbacSeed } from './services/roles.service';

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

// ─── WEBHOOK: Mount BEFORE express.json() ──────────────────────────────────
// Razorpay HMAC-SHA256 verification requires the raw request body as a Buffer.
// If express.json() runs first it parses (and discards) the stream; the raw
// bytes are gone and every signature check will fail.
// The webhookRouter applies express.raw({ type: 'application/json' }) at the
// ROUTE level, so all other application routes are unaffected.
app.use('/api/v1/webhook', webhookRouter);

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

// HTTP request logging
app.use(requestLogger);

// Router
app.use('/api/v1', router);

// 404 Handler
app.use((_req: Request, res: Response) => {
  ResponseUtil.notFound(res, 'Route/Method not found');
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logError('Unhandled Express error', { error: err.message, stack: err.stack });
  ResponseUtil.internalServerError(res, 'Internal server error');
});

let server: Server | null = null;

// Start server
async function startServer(): Promise<void> {
  validateEnv();
  validateEmailConfig();
  await connectDatabase();
  await verifyRbacSeed();
  startEmailWorker();
  server = app.listen(PORT, '0.0.0.0', () => {
    logInfo(`Server started on port ${String(PORT)}`);
  });
  // Register shutdown handlers AFTER server is assigned so the getter returns the live instance
  setupGracefulShutdown(() => server);
}

void startServer();
