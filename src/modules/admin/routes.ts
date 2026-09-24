import { Router } from 'express';
import {
  getConfigs,
  getPublicConfigs,
  getConfigByKey,
  setConfig,
  updateConfigByKey,
  deleteConfigByKey,
  toggleMaintenanceMode,
  getSystemHealth,
  seedMasterConfigs
} from './controller';
import {
  validateAdminConfig,
  validateToggleMaintenance
} from './validations';
import { authenticate } from '../auth/middleware';
import { requireSuperAdmin } from './middleware';

const router = Router();

// Health & Public configuration
router.get('/health', getSystemHealth);
router.get('/system-health', getSystemHealth);
router.get('/configs/public', getPublicConfigs);

// System Setup & Control Panel Switches
router.post('/seed-master-data', authenticate, requireSuperAdmin, seedMasterConfigs);
router.post('/maintenance-mode', authenticate, requireSuperAdmin, validateToggleMaintenance, toggleMaintenanceMode);

// Configs CRUD
router.post('/configs', authenticate, requireSuperAdmin, validateAdminConfig, setConfig);
router.get('/configs', authenticate, getConfigs);
router.get('/configs/:key', authenticate, getConfigByKey);
router.put('/configs/:key', authenticate, requireSuperAdmin, updateConfigByKey);
router.delete('/configs/:key', authenticate, requireSuperAdmin, deleteConfigByKey);

export default router;
