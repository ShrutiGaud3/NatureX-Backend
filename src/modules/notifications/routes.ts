import { Router } from 'express';
import { getMyNotifications, markAsRead, createNotification } from './controller';
import { validateCreateNotification } from './validations';
import { authenticate } from '../auth/middleware';
import { requireNotificationAccess } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

router.get('/', authenticate, requireNotificationAccess, getMyNotifications);
router.patch('/:id/read', authenticate, requireNotificationAccess, markAsRead);
router.post('/', authenticate, requireRole(['admin']), validateCreateNotification, createNotification);

export default router;
