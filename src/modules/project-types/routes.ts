import { Router } from 'express';
import { getProjectTypes, createProjectType } from './controller';
import { validateProjectType } from './validations';
import { authenticate } from '../auth/middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

router.get('/', authenticate, getProjectTypes);
router.post('/', authenticate, requireRole(['admin']), validateProjectType, createProjectType);

export default router;
