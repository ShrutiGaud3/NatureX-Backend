import { Router } from 'express';
import {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  submitProject,
  deleteProject,
  updateProjectImpact,
  reviewProject,
  getProjectsQueue,
  getProjectsStats
} from './controller';
import {
  validateCreateProject,
  validateUpdateProject,
  validateProjectReview,
  validateImpactUpdate
} from './validations';
import { authenticate } from '../auth/middleware';
import { checkLandValidForProject, requireProjectAccess } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

// User / Developer Facing Endpoints
router.post('/', authenticate, validateCreateProject, checkLandValidForProject, createProject);
router.get('/', authenticate, getMyProjects);
router.get('/stats', authenticate, requireRole(['admin']), getProjectsStats);
router.get('/admin/queue', authenticate, requireRole(['admin']), getProjectsQueue);
router.get('/:id', authenticate, requireProjectAccess, getProjectById);
router.put('/:id', authenticate, requireProjectAccess, validateUpdateProject, updateProject);
router.post('/:id/submit', authenticate, requireProjectAccess, submitProject);
router.delete('/:id', authenticate, requireProjectAccess, deleteProject);

// Review & Pipeline Transitions
router.patch('/:id/impact', authenticate, requireRole(['admin']), validateImpactUpdate, updateProjectImpact);
router.patch('/:id/review', authenticate, requireRole(['admin']), validateProjectReview, reviewProject);

export default router;

