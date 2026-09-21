import { Router } from 'express';
import { getAuditLogs, createAuditLog } from './controller';
import { validateAuditQuery } from './validations';
import { authenticate } from '../auth/middleware';
import { requireAuditAccess } from './middleware';

const router = Router();

router.get('/', authenticate, requireAuditAccess, validateAuditQuery, getAuditLogs);
router.post('/', authenticate, requireAuditAccess, createAuditLog);

export default router;
