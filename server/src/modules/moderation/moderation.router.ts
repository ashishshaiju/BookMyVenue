import { Router } from 'express';
import type { Request, Response } from 'express';
import { verifyAccessToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { ResponseUtil } from '../../utils/responseUtils';
import { handleError } from '../../utils/errors';
import { getModerationSummary } from './moderation.service';
import bannedUserRouter from './bannedUser.router';

const router: Router = Router();

/**
 * @openapi
 * /moderation/summary:
 *   get:
 *     tags: [Moderation]
 *     summary: Get moderation dashboard summary (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Moderation summary with flagged reviews, suspended venues, banned users
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not admin
 */
router
  .route('/summary')
  .get(verifyAccessToken, requireRole('admin'), async (_req: Request, res: Response): Promise<void> => {
    try {
      const summary = await getModerationSummary();
      ResponseUtil.success(res, 'Moderation summary retrieved', summary);
    } catch (err) {
      handleError(res, err, 'getModerationSummary');
    }
  });

router.use('/bans', bannedUserRouter);

export { router as moderationRouter };
