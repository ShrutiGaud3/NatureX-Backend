import { Router } from 'express';
import {
  getPermissionsList,
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignUserRole
} from './controller';
import {
  validateCreateRole,
  validateUpdateRole,
  validateAssignUserRole
} from './validations';
import { authenticate } from '../auth/middleware';
import { requireRole } from './middleware';

const router = Router();

// Permission Catalog (Protected)
router.get('/permissions', authenticate, getPermissionsList);

// Roles CRUD (Protected, Admin only for mutations)
router.get('/roles', authenticate, getAllRoles);
router.get('/roles/:id', authenticate, getRoleById);
router.post('/roles', authenticate, requireRole(['admin']), validateCreateRole, createRole);
router.put('/roles/:id', authenticate, requireRole(['admin']), validateUpdateRole, updateRole);
router.delete('/roles/:id', authenticate, requireRole(['admin']), deleteRole);

// Assign Role to User (Admin only)
router.post('/assign-user-role', authenticate, requireRole(['admin']), validateAssignUserRole, assignUserRole);

export default router;
