import { Router } from 'express';
import {
  saveBankProfile,
  getMyBankProfile,
  getBankQueue,
  getBankProfileById,
  reviewBankProfile,
  getBankStats
} from './controller';
import { validateBankProfile, validateReviewBankProfile } from './validations';
import { authenticate } from '../auth/middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

// User Facing Endpoints
router.post('/', authenticate, validateBankProfile, saveBankProfile);
router.put('/', authenticate, validateBankProfile, saveBankProfile);
router.get('/me', authenticate, getMyBankProfile);

// Admin Facing Endpoints
router.get('/stats', authenticate, requireRole(['admin']), getBankStats);
router.get('/admin/queue', authenticate, requireRole(['admin']), getBankQueue);
router.get('/admin/:id', authenticate, requireRole(['admin']), getBankProfileById);
router.patch('/admin/:id/review', authenticate, requireRole(['admin']), validateReviewBankProfile, reviewBankProfile);

export default router;

