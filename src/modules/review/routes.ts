import { Router } from 'express';
import {
  createFinding,
  listFindings,
  getFindingsByProject,
  getFindingById,
  respondToFinding,
  resolveFinding,
  updateFinding,
  deleteFinding,
  getReviewStats
} from './controller';
import {
  validateCreateFinding,
  validateRespondFinding,
  validateResolveFinding
} from './validations';
import { authenticate } from '../auth/middleware';
import { checkReviewerAccess, checkFindingModifiable } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

// Create & List
router.post(
  '/',
  authenticate,
  requireRole(['admin', 'field_agent', 'organization']),
  validateCreateFinding,
  createFinding
);
router.get('/', authenticate, listFindings);
router.get('/project/:projectId', authenticate, getFindingsByProject);
router.get('/stats/:projectId?', authenticate, getReviewStats);
router.get('/:id', authenticate, checkReviewerAccess, getFindingById);

// Response & Resolution Workflow
router.post(
  '/:id/respond',
  authenticate,
  checkReviewerAccess,
  checkFindingModifiable,
  validateRespondFinding,
  respondToFinding
);
router.post(
  '/:id/resolve',
  authenticate,
  requireRole(['admin', 'field_agent', 'organization']),
  validateResolveFinding,
  resolveFinding
);

// Edit & Delete
router.put(
  '/:id',
  authenticate,
  requireRole(['admin', 'field_agent', 'organization']),
  checkFindingModifiable,
  updateFinding
);
router.delete('/:id', authenticate, requireRole(['admin']), deleteFinding);

export default router;

