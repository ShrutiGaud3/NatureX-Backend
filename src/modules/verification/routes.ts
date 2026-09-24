import { Router } from 'express';
import {
  createVerificationCase,
  getVerificationCases,
  getVerificationStats,
  getVerificationByProject,
  getVerificationById,
  updateVerificationCase,
  submitAuditReport,
  submitVerificationDecision,
  issueCertificate,
  deleteVerificationCase
} from './controller';
import {
  validateCreateVerification,
  validateSubmitReport,
  validateVerificationDecision,
  validateIssueCertificate
} from './validations';
import { authenticate } from '../auth/middleware';
import { requireRole } from '../roles-permissions/middleware';
import {
  requireVerifierOrAdmin,
  checkVerificationLock
} from './middleware';

const router = Router();

// Stats & Project lookups (precede /:id)
router.get('/stats', authenticate, requireVerifierOrAdmin, getVerificationStats);
router.get('/project/:projectId', authenticate, getVerificationByProject);

// Initiate & List Cases
router.post(
  '/',
  authenticate,
  requireVerifierOrAdmin,
  validateCreateVerification,
  createVerificationCase
);
router.get('/', authenticate, requireVerifierOrAdmin, getVerificationCases);

// Single Case Details & Pre-approval Updates
router.get('/:id', authenticate, getVerificationById);
router.put('/:id', authenticate, requireVerifierOrAdmin, checkVerificationLock, updateVerificationCase);
router.delete('/:id', authenticate, requireRole(['admin', 'super_admin']), checkVerificationLock, deleteVerificationCase);

// Audit Workflow Actions: Report, Decision, Certificate
router.post(
  '/:id/report',
  authenticate,
  requireVerifierOrAdmin,
  checkVerificationLock,
  validateSubmitReport,
  submitAuditReport
);

router.patch(
  '/:id/decision',
  authenticate,
  requireRole(['admin', 'super_admin', 'reviewer']),
  checkVerificationLock,
  validateVerificationDecision,
  submitVerificationDecision
);

router.post(
  '/:id/certificate',
  authenticate,
  requireRole(['admin', 'super_admin']),
  validateIssueCertificate,
  issueCertificate
);

export default router;
