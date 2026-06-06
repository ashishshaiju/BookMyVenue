import { Router } from 'express';
import { ResponseUtil } from './utils/responseUtils';
import authRoutes from './modules/auth/auth.routes';

const router: Router = Router();

router.get('/health', (_req, res) => {
  ResponseUtil.success(res, 'Service is healthy');
});

router.use('/auth', authRoutes);

export default router;
