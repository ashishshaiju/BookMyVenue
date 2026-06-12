import mongoose from 'mongoose';
import type { Server } from 'http';
import { stopEmailWorker } from '../workers/email.worker';

let isShuttingDown = false;
let getServerFn: (() => Server | null) | null = null;

/**
 * Utility to wrap a promise with a hard timeout.
 * Prevents any single shutdown step from blocking the rest of the sequence.
 */
const withTimeout = async <T>(promise: Promise<T>, ms: number, name: string): Promise<void> => {
  let timeoutHandle: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(
      () => { reject(new Error(`[Timeout] ${name} shutdown exceeded ${ms.toString()}ms`)); },
      ms
    );
  });

  try {
    await Promise.race([promise, timeoutPromise]);
  } catch (err) {
    console.error(`[server] ${name} failed to shut down cleanly:`, (err as Error).message);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

async function gracefulShutdown(signal: string, exitCode = 0): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[server] ${signal} received. Initiating graceful shutdown...`);

  // Global Hard Timeout: If everything completely locks up, OS kills it after 30s.
  const forceExitTimer = setTimeout(() => {
    console.error('[server] GLOBAL shutdown timeout reached (30s). Forcing exit.');
    process.exit(exitCode);
  }, 30_000);
  forceExitTimer.unref();

  try {
    const server = getServerFn ? getServerFn() : null;

    // STEP 1: HTTP Server (Max 5 seconds)
    if (server) {
      console.log('[server] Stopping HTTP server...');

      // If it's a fatal crash, destroy all active connections instantly.
      // If it's a polite signal, just destroy idle connections.
      if (signal === 'Uncaught Exception' || signal === 'Unhandled Rejection') {
        if ('closeAllConnections' in server) {
          console.warn('[server] Fatal crash detected. Severing all active HTTP connections.');
          server.closeAllConnections();
        }
      } else {
        if ('closeIdleConnections' in server) {
          server.closeIdleConnections();
        }
      }

      const closeHttpPromise = new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) { reject(err); return; }
          resolve();
        });
      });

      await withTimeout(closeHttpPromise, 5000, 'HTTP Server');
      console.log('[server] HTTP server closed.');
    }

    // STEP 2: Background Worker (Max 3 seconds)
    console.log('[server] Stopping email worker...');
    await withTimeout(stopEmailWorker(), 3000, 'Email Worker');
    console.log('[server] Email worker stopped.');

    // STEP 3: Database (Max 3 seconds)
    console.log('[server] Closing MongoDB connection...');
    await withTimeout(mongoose.connection.close(false), 3000, 'MongoDB');
    console.log('[server] MongoDB connection closed.');
  } catch (err) {
    console.error('[server] Unexpected error during shutdown sequence:', err);
  }

  console.log('[server] Shutdown sequence complete.');
  process.exit(exitCode);
}

export function setupGracefulShutdown(getServer: () => Server | null): void {
  getServerFn = getServer;

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection', { reason });
    void gracefulShutdown('Unhandled Rejection', 1);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
    });
    void gracefulShutdown('Uncaught Exception', 1);
  });

  process.on('SIGINT', () => {
    void gracefulShutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void gracefulShutdown('SIGTERM');
  });
}
