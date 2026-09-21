import { Router } from 'express';
import { createFinding, getFindingsByProject, respondToFinding, resolveFinding } from './controller';
import { validateCreateFinding } from './validations';
import { authenticate } from '../auth/middleware';
import { checkReviewerAccess } from './middleware';

const router = Router();

router.post('/', authenticate, checkReviewerAccess, validateCreateFinding, createFinding);
router.get('/project/:projectId', authenticate, getFindingsByProject);
router.patch('/:id/respond', authenticate, respondToFinding);
router.patch('/:id/resolve', authenticate, checkReviewerAccess, resolveFinding);

export default router;
