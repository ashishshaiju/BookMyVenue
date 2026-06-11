import { Router } from 'express';
import * as controller from './auth.controller';
import { verifyAccessToken, verifyRefreshToken } from '../../middlewares/auth.middleware';

const router: Router = Router();

router.route('/register').post(controller.register);
router.route('/login').post(controller.login);
router.route('/refresh').post(verifyRefreshToken, controller.refreshToken);
router.route('/logout').post(verifyAccessToken, controller.logout);
router.route('/forgot-password').post(controller.forgotPassword);
router.route('/reset-password').post(controller.resetPassword);

export { router as authRouter };
