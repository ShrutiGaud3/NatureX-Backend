import { Router } from 'express';
import { createProject, getMyProjects, getProjectById, submitProject, reviewProject } from './controller';
import { validateCreateProject, validateProjectReview } from './validations';
import { authenticate } from '../auth/middleware';
import { checkLandApprovedBeforeProject } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

router.post('/', authenticate, validateCreateProject, checkLandApprovedBeforeProject, createProject);
router.get('/', authenticate, getMyProjects);
router.get('/:id', authenticate, getProjectById);
router.post('/:id/submit', authenticate, submitProject);
router.patch('/:id/review', authenticate, requireRole(['admin']), validateProjectReview, reviewProject);

export default router;
