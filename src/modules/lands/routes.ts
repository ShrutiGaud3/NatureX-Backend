import { Router } from 'express';
import {
  createLand,
  getMyLands,
  getLandById,
  updateLand,
  submitLand,
  deleteLand,
  getLandsQueue,
  reviewLand,
  getLandsStats
} from './controller';
import {
  validateCreateLand,
  validateUpdateLand,
  validateLandReview
} from './validations';
import { authenticate } from '../auth/middleware';
import { requireLandOwnerOrAdmin } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

// User / Developer Endpoints
router.post('/', authenticate, validateCreateLand, createLand);
router.get('/', authenticate, getMyLands);
router.get('/stats', authenticate, requireRole(['admin']), getLandsStats);
router.get('/admin/queue', authenticate, requireRole(['admin']), getLandsQueue);
router.get('/:id', authenticate, requireLandOwnerOrAdmin, getLandById);
router.put('/:id', authenticate, requireLandOwnerOrAdmin, validateUpdateLand, updateLand);
router.post('/:id/submit', authenticate, requireLandOwnerOrAdmin, submitLand);
router.delete('/:id', authenticate, requireLandOwnerOrAdmin, deleteLand);

// Admin Screening & Review
router.patch('/:id/review', authenticate, requireRole(['admin']), validateLandReview, reviewLand);

export default router;

