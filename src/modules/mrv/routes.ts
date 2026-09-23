import { Router } from 'express';
import {
  createMrvRecord,
  calculateRemoteSensingDelta,
  listMrvReports,
  getProjectMrvHistory,
  getMrvById,
  submitForVerification,
  reviewMrvRecord,
  updateMrvReport,
  deleteMrvReport,
  getMrvStats
} from './controller';
import {
  validateCreateMrv,
  validateCalculateMrv,
  validateReviewMrv
} from './validations';
import { authenticate } from '../auth/middleware';
import { checkMrvAccess, checkMrvEditable } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

// Create & Calculate Engine
router.post(
  '/',
  authenticate,
  requireRole(['admin', 'project_developer', 'organization']),
  validateCreateMrv,
  createMrvRecord
);
router.post('/calculate', authenticate, validateCalculateMrv, calculateRemoteSensingDelta);

// Query & List
router.get('/', authenticate, listMrvReports);
router.get('/project/:projectId', authenticate, getProjectMrvHistory);
router.get('/stats/:projectId?', authenticate, getMrvStats);
router.get('/:id', authenticate, checkMrvAccess, getMrvById);

// Verification Lifecycle
router.post('/:id/submit', authenticate, checkMrvAccess, checkMrvEditable, submitForVerification);
router.post(
  '/:id/review',
  authenticate,
  requireRole(['admin']),
  validateReviewMrv,
  reviewMrvRecord
);

// Edit & Delete
router.put('/:id', authenticate, checkMrvAccess, checkMrvEditable, updateMrvReport);
router.delete('/:id', authenticate, requireRole(['admin']), deleteMrvReport);

export default router;

