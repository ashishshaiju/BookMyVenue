import { Router } from 'express';
import { ResponseUtil } from './utils/responseUtils';
import { authRouter } from './modules/auth/auth.routes';
import { userRouter } from './modules/user/user.routes';
import { venueRouter } from './modules/venue/venue.routes';
import { bookingRouter } from './modules/booking/booking.routes';
import { rbacRouter } from './modules/rbac/rbac.routes';

const router: Router = Router();

router.get('/health', (_req, res) => {
  ResponseUtil.success(res, 'Service is healthy');
});

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/venues', venueRouter);
router.use('/bookings', bookingRouter);
router.use('/rbac', rbacRouter);

export default router;
