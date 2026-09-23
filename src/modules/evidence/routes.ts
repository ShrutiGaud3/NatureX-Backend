import { Router } from 'express';
import {
  uploadEvidence,
  batchUploadEvidence,
  listEvidence,
  getEvidenceById,
  getEvidenceByProject,
  getEvidenceStats,
  updateEvidence,
  reviewEvidence,
  deleteEvidence
} from './controller';
import {
  validateEvidenceUpload,
  validateBatchUploadEvidence,
  validateReviewEvidence
} from './validations';
import { authenticate } from '../auth/middleware';
import { checkEvidenceAccess, checkEvidenceEditable } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

// Upload Endpoints
router.post('/', authenticate, validateEvidenceUpload, uploadEvidence);
router.post('/batch', authenticate, validateBatchUploadEvidence, batchUploadEvidence);

// Query & Read Endpoints
router.get('/', authenticate, listEvidence);
router.get('/stats/:projectId', authenticate, getEvidenceStats);
router.get('/project/:projectId', authenticate, getEvidenceByProject);
router.get('/:id', authenticate, checkEvidenceAccess, getEvidenceById);

// Update & Review Endpoints
router.put('/:id', authenticate, checkEvidenceAccess, checkEvidenceEditable, updateEvidence);
router.post('/:id/review', authenticate, requireRole(['admin', 'field_agent']), validateReviewEvidence, reviewEvidence);
router.delete('/:id', authenticate, checkEvidenceAccess, checkEvidenceEditable, deleteEvidence);

export default router;

