import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../src/app';
import {
  generateRazorpaySignature,
  createMockRazorpayPaymentCapturedPayload,
  TEST_WEBHOOK_SECRET,
} from '../../helpers/webhook.helper';

describe('Razorpay Webhook API Routes', () => {
  describe('POST /api/v1/webhook/razorpay', () => {
    it('should reject requests missing the x-razorpay-signature header', async () => {
      const payload = createMockRazorpayPaymentCapturedPayload();
      const rawBody = JSON.stringify(payload);

      const response = await request(app)
        .post('/api/v1/webhook/razorpay')
        .set('Content-Type', 'application/json')
        .send(rawBody);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(false);
      expect(response.body.error).toBe('Missing x-razorpay-signature header');
    });

    it('should reject requests with invalid HMAC signatures', async () => {
      const payload = createMockRazorpayPaymentCapturedPayload();
      const rawBody = JSON.stringify(payload);
      const invalidSignature = 'invalid_hmac_signature_hash_1234567890';

      const response = await request(app)
        .post('/api/v1/webhook/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', invalidSignature)
        .send(rawBody);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(false);
      expect(response.body.error).toBe('Invalid webhook signature');
    });

    it('should acknowledge unhandled events with received: true', async () => {
      const unhandledPayload = {
        entity: 'event',
        event: 'payment.failed',
        payload: {},
      };
      const rawBody = JSON.stringify(unhandledPayload);
      const signature = generateRazorpaySignature(rawBody, TEST_WEBHOOK_SECRET);

      const response = await request(app)
        .post('/api/v1/webhook/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', signature)
        .send(rawBody);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should process payment.captured event and return received: true', async () => {
      const payload = createMockRazorpayPaymentCapturedPayload();
      const rawBody = JSON.stringify(payload);
      const signature = generateRazorpaySignature(rawBody, TEST_WEBHOOK_SECRET);

      const response = await request(app)
        .post('/api/v1/webhook/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', signature)
        .send(rawBody);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should handle duplicate webhook events idempotently', async () => {
      const paymentId = `pay_duplicate_test_${Date.now()}`;
      const payload = createMockRazorpayPaymentCapturedPayload({ paymentId });
      const rawBody = JSON.stringify(payload);
      const signature = generateRazorpaySignature(rawBody, TEST_WEBHOOK_SECRET);

      // First webhook post
      await request(app)
        .post('/api/v1/webhook/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', signature)
        .send(rawBody);

      // Duplicate webhook post
      const response = await request(app)
        .post('/api/v1/webhook/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', signature)
        .send(rawBody);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
      expect(response.body.idempotent).toBe(true);
    });
  });
});
