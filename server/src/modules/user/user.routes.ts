import { Router } from 'express';
import * as controller from './user.controller';
import { verifyAccessToken } from '../../middlewares/auth.middleware';

const router: Router = Router();

router.route('/profile').get(verifyAccessToken, controller.getProfile);

export { router as userRouter };
