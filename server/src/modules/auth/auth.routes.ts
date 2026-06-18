import { Router } from 'express';
import * as controller from './auth.controller';
import * as authValidator from './auth.validator';
import { validateBody } from '../../middlewares/validation.middleware';
import { verifyAccessToken, verifyRefreshToken } from '../../middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';

const router: Router = Router();

const secondaryRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15mints
  max: 5,
  message: 'Too many requests from this IP. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.route('/register').post(validateBody(authValidator.registerSchema), controller.register);
router.route('/login').post(validateBody(authValidator.loginSchema), controller.login);
router.route('/refresh').post(verifyRefreshToken, controller.refreshToken);
router.route('/logout').post(verifyAccessToken, verifyRefreshToken, controller.logout);
router
  .route('/forgot-password')
  .post(
    secondaryRateLimiter,
    validateBody(authValidator.forgotPasswordSchema),
    controller.forgotPassword
  );
router
  .route('/reset-password')
  .post(validateBody(authValidator.resetPasswordSchema), controller.resetPassword);

export { router as authRouter };
