import { Router } from 'express';
import { recordBenefit, getMyBenefits, updatePayoutStatus } from './controller';
import { validateCreateBenefit, validateUpdatePayoutStatus } from './validations';
import { authenticate } from '../auth/middleware';
import { requireFinanceAccess } from './middleware';

const router = Router();

router.post('/', authenticate, requireFinanceAccess, validateCreateBenefit, recordBenefit);
router.get('/', authenticate, getMyBenefits);
router.patch('/:id/payout-status', authenticate, requireFinanceAccess, validateUpdatePayoutStatus, updatePayoutStatus);

export default router;
