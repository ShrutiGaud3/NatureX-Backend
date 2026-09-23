import { Router } from 'express';
import {
  createVisit,
  listVisits,
  getVisitById,
  getMyVisits,
  startVisit,
  completeVisit,
  rescheduleVisit,
  cancelVisit,
  syncOfflineVisit,
  getVisitStats
} from './controller';
import {
  validateCreateVisit,
  validateStartVisit,
  validateCompleteVisit,
  validateRescheduleVisit,
  validateCancelVisit,
  validateSyncVisit
} from './validations';
import { authenticate } from '../auth/middleware';
import { requireAssignedAgentOrAdmin, checkVisitActionable } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

// Schedule & Create
router.post(
  '/',
  authenticate,
  requireRole(['admin', 'project_developer', 'organization']),
  validateCreateVisit,
  createVisit
);

// Query & List
router.get('/', authenticate, listVisits);
router.get('/my-visits', authenticate, getMyVisits);
router.get('/stats/:projectId?', authenticate, getVisitStats);
router.get('/:id', authenticate, getVisitById);

// Execution Flow (Check-in & Check-out)
router.post(
  '/:id/start',
  authenticate,
  requireAssignedAgentOrAdmin,
  checkVisitActionable,
  validateStartVisit,
  startVisit
);
router.post(
  '/:id/complete',
  authenticate,
  requireAssignedAgentOrAdmin,
  checkVisitActionable,
  validateCompleteVisit,
  completeVisit
);

// Reschedule & Cancel
router.post(
  '/:id/reschedule',
  authenticate,
  requireRole(['admin', 'project_developer', 'organization']),
  checkVisitActionable,
  validateRescheduleVisit,
  rescheduleVisit
);
router.post(
  '/:id/cancel',
  authenticate,
  requireRole(['admin', 'project_developer', 'organization']),
  checkVisitActionable,
  validateCancelVisit,
  cancelVisit
);

// Mobile App Offline Sync
router.post(
  '/sync',
  authenticate,
  requireAssignedAgentOrAdmin,
  validateSyncVisit,
  syncOfflineVisit
);

export default router;

