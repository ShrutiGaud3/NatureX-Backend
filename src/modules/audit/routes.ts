import { Router } from 'express';
import {
  createAuditLog,
  batchCreateAuditLogs,
  getAuditLogs,
  getAuditStats,
  getResourceTimeline,
  getAuditLogById,
  exportAuditLogs
} from './controller';
import {
  validateCreateAuditLog,
  validateAuditQuery
} from './validations';
import { authenticate } from '../auth/middleware';
import { requireAuditAccess } from './middleware';

const router = Router();

// Stats, Export & Resource Timeline (precede /:id)
router.get('/stats', authenticate, requireAuditAccess, getAuditStats);
router.get('/export', authenticate, requireAuditAccess, exportAuditLogs);
router.get('/resource/:resourceType/:resourceId', authenticate, requireAuditAccess, getResourceTimeline);

// Record Audit Logs
router.post('/batch', authenticate, requireAuditAccess, batchCreateAuditLogs);
router.post('/', authenticate, requireAuditAccess, validateCreateAuditLog, createAuditLog);

// Query & Single Entry
router.get('/', authenticate, requireAuditAccess, validateAuditQuery, getAuditLogs);
router.get('/:id', authenticate, requireAuditAccess, getAuditLogById);

export default router;
