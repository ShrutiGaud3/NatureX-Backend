import { Router } from 'express';
import {
  createTask,
  listTasks,
  getTaskById,
  getMyTasks,
  startTask,
  submitTask,
  verifyTask,
  updateTask,
  deleteTask,
  getTaskStats
} from './controller';
import {
  validateCreateTask,
  validateSubmitTask,
  validateVerifyTask
} from './validations';
import { authenticate } from '../auth/middleware';
import { checkTaskAccess, checkTaskModifiable } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

// Create & List
router.post(
  '/',
  authenticate,
  requireRole(['admin', 'project_developer', 'organization']),
  validateCreateTask,
  createTask
);
router.get('/', authenticate, listTasks);
router.get('/my-tasks', authenticate, getMyTasks);
router.get('/stats/:projectId?', authenticate, getTaskStats);
router.get('/:id', authenticate, checkTaskAccess, getTaskById);

// Execution Lifecycle (Start & Submit)
router.post('/:id/start', authenticate, checkTaskAccess, checkTaskModifiable, startTask);
router.post('/:id/submit', authenticate, checkTaskAccess, checkTaskModifiable, validateSubmitTask, submitTask);

// Review & Verification (Admin & Developer)
router.post(
  '/:id/verify',
  authenticate,
  requireRole(['admin', 'project_developer', 'organization']),
  validateVerifyTask,
  verifyTask
);

// Update & Cancel
router.put('/:id', authenticate, requireRole(['admin', 'project_developer', 'organization']), checkTaskModifiable, updateTask);
router.delete('/:id', authenticate, requireRole(['admin', 'project_developer', 'organization']), deleteTask);

export default router;

