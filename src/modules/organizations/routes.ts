import { Router } from 'express';
import { createOrg, getOrgDetails, submitForVerification } from './controller';
import { validateCreateOrg } from './validations';
import { authenticate } from '../auth/middleware';
import { requireOrgAccess } from './middleware';

const router = Router();

router.post('/', authenticate, validateCreateOrg, createOrg);
router.get('/:id', authenticate, requireOrgAccess, getOrgDetails);
router.post('/:id/submit', authenticate, requireOrgAccess, submitForVerification);

export default router;
