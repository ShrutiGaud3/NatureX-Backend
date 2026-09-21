import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updateLanguage,
  getUserById,
  getAllUsers,
  updateUserStatus
} from './controller';
import {
  validateUpdateProfile,
  validateUpdateLanguage,
  validateUpdateStatus
} from './validations';
import { authenticate } from '../auth/middleware';
import { requireActiveUser, requireSelfOrAdmin } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

// User Self Profile Routes (Screen F06, F02, F34)
router.get('/profile', authenticate, requireActiveUser, getProfile);
router.put('/profile', authenticate, requireActiveUser, validateUpdateProfile, updateProfile);
router.patch('/profile/language', authenticate, requireActiveUser, validateUpdateLanguage, updateLanguage);

// Admin & Scoped Management Routes
router.get('/', authenticate, requireRole(['admin', 'organization']), getAllUsers);
router.get('/:id', authenticate, requireSelfOrAdmin, getUserById);
router.patch('/:id/status', authenticate, requireRole(['admin']), validateUpdateStatus, updateUserStatus);

export default router;
