import { Router } from 'express';
import { getRoles, createRole } from './controller';
import { validateRoleInput } from './validations';
import { authenticate } from '../auth/middleware';
import { requireRole } from './middleware';

const router = Router();

router.get('/', authenticate, getRoles);
router.post('/', authenticate, requireRole(['admin']), validateRoleInput, createRole);

export default router;
