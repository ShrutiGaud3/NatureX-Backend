import { Router } from 'express';
import {
  getProjectTypes,
  getProjectTypeByKeyOrId,
  createProjectType,
  updateProjectType,
  toggleProjectTypeStatus,
  deleteProjectType,
  seedDefaultProjectTypes
} from './controller';
import {
  validateCreateProjectType,
  validateUpdateProjectType,
  validateToggleStatus
} from './validations';
import { authenticate } from '../auth/middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

// Public / User Facing Endpoints
router.get('/', getProjectTypes);
router.get('/:keyOrId', getProjectTypeByKeyOrId);

// Admin Configuration Endpoints
router.post('/seed', authenticate, requireRole(['admin']), seedDefaultProjectTypes);
router.post('/', authenticate, requireRole(['admin']), validateCreateProjectType, createProjectType);
router.put('/:id', authenticate, requireRole(['admin']), validateUpdateProjectType, updateProjectType);
router.patch('/:id/status', authenticate, requireRole(['admin']), validateToggleStatus, toggleProjectTypeStatus);
router.delete('/:id', authenticate, requireRole(['admin']), deleteProjectType);

export default router;

