import { Router } from 'express';
import { ResponseUtil } from './utils/responseUtils';
import {authRouter} from './modules/auth/auth.routes';
import { userRouter } from './modules/user/user.routes';

const router: Router = Router();

router.get('/health', (_req, res) => {
  ResponseUtil.success(res, 'Service is healthy');
});

router.use('/auth', authRouter);
router.use('/user', userRouter);

export default router;
