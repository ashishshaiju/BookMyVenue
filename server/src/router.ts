import { Router } from 'express';
import { ResponseUtil } from './utils/responseUtils';
import { authRouter } from './modules/auth/auth.routes';
import { userRouter } from './modules/user/user.routes';
import { venueRouter } from './modules/venue/venue.routes';
import { bookingRouter } from './modules/booking/booking.routes';
import { rbacRouter } from './modules/rbac/rbac.routes';
import { webhookRouter } from './modules/webhook/webhook.router';
import { availabilityRouter } from './modules/availability/availability.router';
import { swaggerRouter } from './modules/swagger/swagger.router';

const router: Router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Server health check
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/health', (_req, res) => {
  ResponseUtil.success(res, 'Service is healthy');
});

// NOTE: webhookRouter is also registered BEFORE express.json() in server.ts
// so the raw body buffer is preserved for HMAC verification. See server.ts.
router.use('/webhook', webhookRouter);

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/venues', venueRouter);
router.use('/bookings', bookingRouter);
router.use('/availability', availabilityRouter);
router.use('/rbac', rbacRouter);
router.use('/swagger', swaggerRouter);

export default router;

