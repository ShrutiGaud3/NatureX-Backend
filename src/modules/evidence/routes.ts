import { Router } from 'express';
import { uploadEvidence, getEvidenceByProject, reviewEvidence } from './controller';
import { validateEvidenceUpload } from './validations';
import { authenticate } from '../auth/middleware';
import { checkEvidenceUploadPermissions } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

router.post('/', authenticate, checkEvidenceUploadPermissions, validateEvidenceUpload, uploadEvidence);
router.get('/project/:projectId', authenticate, getEvidenceByProject);
router.patch('/:id/review', authenticate, requireRole(['admin']), reviewEvidence);

export default router;
