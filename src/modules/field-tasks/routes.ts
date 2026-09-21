import { Router } from 'express';
import { createTask, getTasks, updateTaskStatus } from './controller';
import { validateCreateTask } from './validations';
import { authenticate } from '../auth/middleware';
import { checkTaskAccess } from './middleware';

const router = Router();

router.post('/', authenticate, checkTaskAccess, validateCreateTask, createTask);
router.get('/', authenticate, checkTaskAccess, getTasks);
router.patch('/:id/status', authenticate, checkTaskAccess, updateTaskStatus);

export default router;
