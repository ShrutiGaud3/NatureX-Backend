import { Router } from 'express';
import { createLand, getMyLands, getLandById, submitLand, reviewLand } from './controller';
import { validateCreateLand, validateLandReview } from './validations';
import { authenticate } from '../auth/middleware';
import { requireLandOwnerOrAdmin } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

router.post('/', authenticate, validateCreateLand, createLand);
router.get('/', authenticate, getMyLands);
router.get('/:id', authenticate, requireLandOwnerOrAdmin, getLandById);
router.post('/:id/submit', authenticate, requireLandOwnerOrAdmin, submitLand);
router.patch('/:id/review', authenticate, requireRole(['admin']), validateLandReview, reviewLand);

export default router;
