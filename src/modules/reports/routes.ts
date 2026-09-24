import { Router } from 'express';
import {
  getExecutiveDashboard,
  generateReport,
  listReports,
  getReportById,
  exportReportData,
  getProjectImpactReport,
  deleteReport
} from './controller';
import {
  validateGenerateReport,
  validateExportReport
} from './validations';
import { authenticate } from '../auth/middleware';
import { requireRole } from '../roles-permissions/middleware';
import {
  requireReportsAccess,
  canAccessReport
} from './middleware';

const router = Router();

// Executive Dashboard & Project Impact KPIs (precede /:id)
router.get('/executive-dashboard', authenticate, requireReportsAccess, getExecutiveDashboard);
router.get('/impact/:projectId', authenticate, requireReportsAccess, getProjectImpactReport);

// Generate Reports
router.post('/generate', authenticate, requireReportsAccess, validateGenerateReport, generateReport);
router.post('/', authenticate, requireReportsAccess, validateGenerateReport, generateReport);

// List Reports
router.get('/', authenticate, requireReportsAccess, listReports);

// Single Report Detail, Export & Deletion
router.get('/:id/export', authenticate, canAccessReport, validateExportReport, exportReportData);
router.get('/:id', authenticate, canAccessReport, getReportById);
router.delete('/:id', authenticate, requireRole(['admin', 'super_admin']), deleteReport);

export default router;
