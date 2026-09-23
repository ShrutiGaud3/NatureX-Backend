import { Router } from 'express';
import {
  uploadDocument,
  getDocumentsByLand,
  getMyDocuments,
  getDocumentById,
  deleteDocument,
  verifyDocument,
  getLandDocumentsQueue,
  getDocumentStats
} from './controller';
import { validateDocumentUpload, validateDocumentReview } from './validations';
import { authenticate } from '../auth/middleware';
import { requireDocumentAccess } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

// User / Developer Facing Endpoints
router.post('/', authenticate, requireDocumentAccess, validateDocumentUpload, uploadDocument);
router.get('/', authenticate, getMyDocuments);
router.get('/land/:landId', authenticate, requireDocumentAccess, getDocumentsByLand);
router.get('/stats', authenticate, requireRole(['admin']), getDocumentStats);
router.get('/admin/queue', authenticate, requireRole(['admin']), getLandDocumentsQueue);
router.get('/:id', authenticate, requireDocumentAccess, getDocumentById);
router.delete('/:id', authenticate, requireDocumentAccess, deleteDocument);

// Admin Review & Verification
router.patch('/:id/verify', authenticate, requireRole(['admin']), validateDocumentReview, verifyDocument);

export default router;

