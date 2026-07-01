import { Router } from 'express';
import * as controller from './user.controller';
import { verifyAccessToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';

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

/**
 * @openapi
 * /user/all:
 *   get:
 *     tags: [User]
 *     summary: Get all users (Admin/SuperAdmin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter users by role name
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden
 */
router.route('/all').get(
  verifyAccessToken,
  requireRole('superAdmin'),
  controller.getAllUsers
);

/**
 * @openapi
 * /user/{userId}/toggle-status:
 *   patch:
 *     tags: [User]
 *     summary: Toggle user active status (SuperAdmin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User status toggled successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: SuperAdmin role required
 */
router.route('/:userId/toggle-status').patch(
  verifyAccessToken,
  requireRole('superAdmin'),
  controller.toggleUserStatus
);

/**
 * @openapi
 * /user/{userId}/reset-password:
 *   post:
 *     tags: [User]
 *     summary: Reset user password and email (SuperAdmin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User password reset successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: SuperAdmin role required
 */
router.route('/:userId/reset-password').post(
  verifyAccessToken,
  requireRole('superAdmin'),
  controller.resetUserPassword
);

export { router as userRouter };
