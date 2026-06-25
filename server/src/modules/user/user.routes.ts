import { Router } from 'express';
import * as controller from './user.controller';
import { verifyAccessToken } from '../../middlewares/auth.middleware';

const router: Router = Router();

/**
 * @openapi
 * /user/profile:
 *   get:
 *     tags: [User]
 *     summary: Get the authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *       401:
 *         description: Not authenticated
 */
router.route('/profile').get(verifyAccessToken, controller.getProfile);

export { router as userRouter };
