import { Router } from 'express';
import {
  createProgram,
  getPrograms,
  getProgramStats,
  getMyEnrollments,
  getProgramById,
  updateProgram,
  deleteProgram,
  enrollInProgram,
  reviewEnrollment,
  withdrawEnrollment
} from './controller';
import {
  validateCreateProgram,
  validateUpdateProgram,
  validateEnrollProgram,
  validateReviewEnrollment
} from './validations';
import { authenticate } from '../auth/middleware';
import { requireRole } from '../roles-permissions/middleware';
import { checkProgramEligibility, checkProgramManager } from './middleware';

const router = Router();

// Stats & My Enrollments (must be placed before parameterized /:id)
router.get('/stats', authenticate, getProgramStats);
router.get('/my-enrollments', authenticate, getMyEnrollments);

// Main Program CRUD
router.post(
  '/',
  authenticate,
  requireRole(['admin', 'super_admin', 'project_developer']),
  validateCreateProgram,
  createProgram
);

router.get('/', authenticate, getPrograms);
router.get('/:id', authenticate, getProgramById);

router.put(
  '/:id',
  authenticate,
  checkProgramManager,
  validateUpdateProgram,
  updateProgram
);

router.delete(
  '/:id',
  authenticate,
  checkProgramManager,
  deleteProgram
);

// Enrollment lifecycle
router.post(
  '/:id/enroll',
  authenticate,
  validateEnrollProgram,
  checkProgramEligibility,
  enrollInProgram
);

router.put(
  '/:id/enrollments/:enrollmentCode',
  authenticate,
  requireRole(['admin', 'super_admin', 'project_developer', 'reviewer']),
  validateReviewEnrollment,
  reviewEnrollment
);

router.delete(
  '/:id/enrollments/:enrollmentCode',
  authenticate,
  withdrawEnrollment
);

export default router;
