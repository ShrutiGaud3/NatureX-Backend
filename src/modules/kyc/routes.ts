import { Router } from 'express';
import { submitKyc, getMyKyc, reviewKyc, getKycQueue } from './controller';
import { validateKycSubmission, validateKycReview } from './validations';
import { authenticate } from '../auth/middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

router.post('/submit', authenticate, validateKycSubmission, submitKyc);
router.get('/my-kyc', authenticate, getMyKyc);
router.get('/admin/queue', authenticate, requireRole(['admin']), getKycQueue);
router.patch('/admin/:id/review', authenticate, requireRole(['admin']), validateKycReview, reviewKyc);

export default router;
