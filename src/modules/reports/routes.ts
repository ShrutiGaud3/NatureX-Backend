import { Router } from 'express';
import { getDashboardStats, generateReport } from './controller';
import { validateGenerateReport } from './validations';
import { authenticate } from '../auth/middleware';
import { requireReportsAccess } from './middleware';

const router = Router();

router.get('/dashboard-stats', authenticate, requireReportsAccess, getDashboardStats);
router.post('/generate', authenticate, requireReportsAccess, validateGenerateReport, generateReport);

export default router;
