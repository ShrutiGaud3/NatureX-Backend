import { Router } from 'express';
import {
  createNotification,
  broadcastNotification,
  getMyNotifications,
  getUnreadCount,
  getNotificationStats,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification
} from './controller';
import {
  validateCreateNotification,
  validateBroadcastNotification
} from './validations';
import { authenticate } from '../auth/middleware';
import { requireRole } from '../roles-permissions/middleware';
import {
  requireNotificationAccess,
  canAccessNotification
} from './middleware';

const router = Router();

// Fast Badge count & stats (must precede /:id)
router.get('/unread-count', authenticate, requireNotificationAccess, getUnreadCount);
router.get('/stats', authenticate, requireRole(['admin', 'super_admin']), getNotificationStats);
router.patch('/mark-all-read', authenticate, requireNotificationAccess, markAllAsRead);

// Broadcast & Single Creation
router.post(
  '/broadcast',
  authenticate,
  requireRole(['admin', 'super_admin']),
  validateBroadcastNotification,
  broadcastNotification
);
router.post(
  '/',
  authenticate,
  requireRole(['admin', 'super_admin', 'project_developer']),
  validateCreateNotification,
  createNotification
);

// Get User Notifications
router.get('/', authenticate, requireNotificationAccess, getMyNotifications);
router.get('/:id', authenticate, canAccessNotification, getNotificationById);

// State transitions
router.patch('/:id/read', authenticate, requireNotificationAccess, markAsRead);
router.patch('/:id/archive', authenticate, requireNotificationAccess, archiveNotification);
router.delete('/:id', authenticate, canAccessNotification, deleteNotification);

export default router;
