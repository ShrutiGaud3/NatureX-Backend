import { Router } from 'express';
import { createVerificationCase, getVerificationByProject, submitVerificationDecision } from './controller';
import { validateCreateVerification, validateVerificationDecision } from './validations';
import { authenticate } from '../auth/middleware';
import { checkVerificationLock } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

router.post('/', authenticate, requireRole(['admin']), validateCreateVerification, createVerificationCase);
router.get('/project/:projectId', authenticate, getVerificationByProject);
router.patch('/:id/decision', authenticate, requireRole(['admin']), checkVerificationLock, validateVerificationDecision, submitVerificationDecision);

export default router;
