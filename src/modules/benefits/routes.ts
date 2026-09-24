import { Router } from 'express';
import {
  recordBenefit,
  bulkDistributeBenefits,
  getBenefits,
  getBenefitStats,
  getMyBenefitLedger,
  getBenefitById,
  updateBenefit,
  approveBenefit,
  processPayout,
  updatePayoutStatus,
  deleteBenefit
} from './controller';
import {
  validateCreateBenefit,
  validateBulkCalculate,
  validateUpdatePayoutStatus,
  validateProcessPayout
} from './validations';
import { authenticate } from '../auth/middleware';
import {
  requireFinanceAccess,
  requireAdminOrFinance,
  canAccessBenefit
} from './middleware';

const router = Router();

// Stats and Beneficiary Personal Ledger (must precede /:id)
router.get('/stats', authenticate, requireFinanceAccess, getBenefitStats);
router.get('/my-ledger', authenticate, getMyBenefitLedger);

// Bulk batch distribution
router.post(
  '/bulk-calculate',
  authenticate,
  requireFinanceAccess,
  validateBulkCalculate,
  bulkDistributeBenefits
);

// Benefit Record CRUD
router.post('/', authenticate, requireFinanceAccess, validateCreateBenefit, recordBenefit);
router.get('/', authenticate, requireFinanceAccess, getBenefits);
router.get('/:id', authenticate, canAccessBenefit, getBenefitById);
router.put('/:id', authenticate, requireFinanceAccess, updateBenefit);
router.delete('/:id', authenticate, requireAdminOrFinance, deleteBenefit);

// Payout lifecycle
router.put('/:id/approve', authenticate, requireAdminOrFinance, approveBenefit);
router.post(
  '/:id/process-payout',
  authenticate,
  requireAdminOrFinance,
  validateProcessPayout,
  processPayout
);
router.patch(
  '/:id/payout-status',
  authenticate,
  requireAdminOrFinance,
  validateUpdatePayoutStatus,
  updatePayoutStatus
);

export default router;
