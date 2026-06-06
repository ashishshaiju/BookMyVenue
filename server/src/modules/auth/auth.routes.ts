import { Router } from 'express';
import * as controller from './auth.controller';
import { verifyAccessToken, verifyRefreshToken } from '../../middlewares/auth.middleware';

const router: Router = Router();

router.route('/register').post(controller.register);
router.route('/login').post(controller.login);
router.route('/refresh').get(verifyRefreshToken, controller.refreshToken);
router.route('/logout').get(verifyAccessToken, controller.logout);
router.route('/profile').get(verifyAccessToken, controller.getProfile);

export { router as authRouter };
