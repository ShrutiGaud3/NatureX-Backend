import { Router } from 'express';
import { getConfigs, setConfig } from './controller';
import { validateAdminConfig } from './validations';
import { authenticate } from '../auth/middleware';
import { requireSuperAdmin } from './middleware';

const router = Router();

router.get('/configs', authenticate, getConfigs);
router.post('/configs', authenticate, requireSuperAdmin, validateAdminConfig, setConfig);

export default router;
