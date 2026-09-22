import { Router } from 'express';
import {
  saveDraftKyc,
  submitKyc,
  getMyKyc,
  replyClarification,
  getKycQueue,
  getKycById,
  reviewKyc,
  getKycStats
} from './controller';
import {
  validateKycDraft,
  validateKycSubmission,
  validateKycReview,
  validateClarificationReply
} from './validations';
import { authenticate } from '../auth/middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

// User Facing Endpoints
router.post('/draft', authenticate, validateKycDraft, saveDraftKyc);
router.post('/submit', authenticate, validateKycSubmission, submitKyc);
router.get('/my-kyc', authenticate, getMyKyc);
router.post('/clarification-reply', authenticate, validateClarificationReply, replyClarification);

// Admin / Reviewer Facing Endpoints
router.get('/stats', authenticate, requireRole(['admin']), getKycStats);
router.get('/admin/queue', authenticate, requireRole(['admin']), getKycQueue);
router.get('/admin/:id', authenticate, requireRole(['admin']), getKycById);
router.patch('/admin/:id/review', authenticate, requireRole(['admin']), validateKycReview, reviewKyc);

export default router;

