import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Import All 25 Module Routers
import authRoutes from './modules/auth/routes';
import userRoutes from './modules/users/routes';
import rolesPermissionsRoutes from './modules/roles-permissions/routes';
import organizationRoutes from './modules/organizations/routes';
import kycRoutes from './modules/kyc/routes';
import bankPayoutProfileRoutes from './modules/bank-payout-profile/routes';
import landRoutes from './modules/lands/routes';
import gisRoutes from './modules/gis/routes';
import landDocumentsRoutes from './modules/land-documents/routes';
import projectRoutes from './modules/projects/routes';
import projectTypesRoutes from './modules/project-types/routes';
import projectQuestionnairesRoutes from './modules/project-questionnaires/routes';
import evidenceRoutes from './modules/evidence/routes';
import fieldVisitsRoutes from './modules/field-visits/routes';
import fieldTasksRoutes from './modules/field-tasks/routes';
import mrvRoutes from './modules/mrv/routes';
import reviewRoutes from './modules/review/routes';
import verificationRoutes from './modules/verification/routes';
import programRoutes from './modules/programs/routes';
import benefitRoutes from './modules/benefits/routes';
import notificationRoutes from './modules/notifications/routes';
import supportRoutes from './modules/support/routes';
import reportRoutes from './modules/reports/routes';
import auditRoutes from './modules/audit/routes';
import adminRoutes from './modules/admin/routes';

const app: Application = express();

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check Endpoint
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'ONLINE',
    service: 'NATUREX Climate & Nature Impact Platform Backend',
    timestamp: new Date().toISOString()
  });
});

// Mount Module Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles-permissions', rolesPermissionsRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/kyc', kycRoutes);
app.use('/api/v1/bank-payout-profile', bankPayoutProfileRoutes);
app.use('/api/v1/lands', landRoutes);
app.use('/api/v1/gis', gisRoutes);
app.use('/api/v1/land-documents', landDocumentsRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/project-types', projectTypesRoutes);
app.use('/api/v1/project-questionnaires', projectQuestionnairesRoutes);
app.use('/api/v1/evidence', evidenceRoutes);
app.use('/api/v1/field-visits', fieldVisitsRoutes);
app.use('/api/v1/field-tasks', fieldTasksRoutes);
app.use('/api/v1/mrv', mrvRoutes);
app.use('/api/v1/review', reviewRoutes);
app.use('/api/v1/verification', verificationRoutes);
app.use('/api/v1/programs', programRoutes);
app.use('/api/v1/benefits', benefitRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: [${req.method}] ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error Handler]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;
