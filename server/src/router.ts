import { Router } from 'express';
import { ResponseUtil } from './utils/responseUtils';

const router: Router = Router();

router.get('/hello', (_req, res) => {
  ResponseUtil.success(res, 'Hello World!');
});

export default router;
