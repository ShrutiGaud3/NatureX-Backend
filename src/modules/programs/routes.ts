import { Router } from 'express';
import { createProgram, getPrograms, enrollProject } from './controller';
import { validateCreateProgram } from './validations';
import { authenticate } from '../auth/middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

router.post('/', authenticate, requireRole(['admin']), validateCreateProgram, createProgram);
router.get('/', authenticate, getPrograms);
router.post('/enroll', authenticate, enrollProject);

export default router;
