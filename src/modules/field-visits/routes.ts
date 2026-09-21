import { Router } from 'express';
import { createVisit, getMyVisits, startVisit, syncOfflineVisit } from './controller';
import { validateCreateVisit, validateSyncVisit } from './validations';
import { authenticate } from '../auth/middleware';
import { requireAssignedAgent } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

router.post('/', authenticate, requireRole(['admin', 'organization']), validateCreateVisit, createVisit);
router.get('/', authenticate, getMyVisits);
router.patch('/:id/start', authenticate, requireAssignedAgent, startVisit);
router.post('/sync', authenticate, requireAssignedAgent, validateSyncVisit, syncOfflineVisit);

export default router;
