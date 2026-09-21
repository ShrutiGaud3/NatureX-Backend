import { Router } from 'express';
import { createMrvRecord, getProjectMrvHistory, reviewMrvRecord } from './controller';
import { validateMrvRecord } from './validations';
import { authenticate } from '../auth/middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

router.post('/', authenticate, validateMrvRecord, createMrvRecord);
router.get('/project/:projectId', authenticate, getProjectMrvHistory);
router.patch('/:id/review', authenticate, requireRole(['admin']), reviewMrvRecord);

export default router;
