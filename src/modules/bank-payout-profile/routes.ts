import { Router } from 'express';
import { saveBankProfile, getBankProfile } from './controller';
import { validateBankProfile } from './validations';
import { authenticate } from '../auth/middleware';

const router = Router();

router.post('/', authenticate, validateBankProfile, saveBankProfile);
router.get('/me', authenticate, getBankProfile);

export default router;
