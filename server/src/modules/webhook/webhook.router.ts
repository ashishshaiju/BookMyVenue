/**
 * webhook.router.ts
 *
 * CRITICAL: This router applies `express.raw({ type: 'application/json' })`
 * as route-level middleware on the Razorpay webhook endpoint.
 *
 * This MUST be registered in server.ts BEFORE the global `express.json()`
 * middleware. Express matches routes in registration order — if express.json()
 * runs first, it consumes the stream and the raw Buffer is lost, breaking
 * the HMAC signature verification.
 *
 * The route intentionally has NO auth middleware. Razorpay sends webhooks
 * from their servers; the HMAC-SHA256 signature check in the controller
 * IS the authentication.
 */

import express, { Router } from 'express';
import { handleRazorpayWebhook } from './webhook.controller';

const router: Router = Router();

router
  .route('/razorpay')
  .post(
    // Capture the raw bytes BEFORE any JSON parsing
    express.raw({ type: 'application/json' }),
    handleRazorpayWebhook
  );

export { router as webhookRouter };
