import { Router } from 'express';
import { uploadDocument, getDocumentsByLand, verifyDocument } from './controller';
import { validateDocumentUpload } from './validations';
import { authenticate } from '../auth/middleware';
import { requireDocumentAccess } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

router.post('/', authenticate, requireDocumentAccess, validateDocumentUpload, uploadDocument);
router.get('/land/:landId', authenticate, requireDocumentAccess, getDocumentsByLand);
router.patch('/:id/verify', authenticate, requireRole(['admin']), verifyDocument);

export default router;
