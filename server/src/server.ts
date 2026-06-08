import 'dotenv/config';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import type { Express, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import type { Server } from 'http';

import { corsOptions } from './configs/cors.config';
import { connectDatabase } from './configs/database.config';
import router from './router';
import { ResponseUtil } from './utils/responseUtils';
import { validateEmailConfig } from './services/email.service';
import { startEmailWorker } from './workers/email.worker';
import { setupGracefulShutdown } from './utils/shutdownUtils';

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

// Shutdown debugging routes
// app.get('/dev/pid', (_req: Request, res: Response) => res.send(String(process.pid)));
// app.get('/dev/crash', () => {
//   setTimeout(() => {
//     throw new Error('Simulated fatal database connection loss');
//   }, 100);
// });
// app.get('/dev/slow', async (_req: Request, res: Response) => {
//   await new Promise((r) => setTimeout(r, 8000));
//   res.send('Finished!');
// });

// Router
app.use('/api/v1', router);

// 404 Handler
app.use((_req: Request, res: Response) => {
  ResponseUtil.notFound(res, 'Route/Method not found');
});

// Global error handler
app.use((_req: Request, res: Response, _next: unknown) => {
  ResponseUtil.internalServerError(res, 'Internal server error');
});

let server: Server | null = null;

// Start server
async function startServer(): Promise<void> {
  validateEmailConfig();
  await connectDatabase();
  startEmailWorker();
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Started on Port ${String(PORT)}`);
  });
  // Register shutdown handlers AFTER server is assigned so the getter returns the live instance
  setupGracefulShutdown(() => server);
}

void startServer();
