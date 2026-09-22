import { Router } from 'express';
import {
  createOrg,
  getMyOrganization,
  getOrgDetails,
  updateOrg,
  submitOrgForVerification,
  getOrgDashboard,
  inviteFarmer,
  bulkImportFarmers,
  getOrgFarmers,
  addTeamMember,
  getOrgMembers,
  removeTeamMember,
  getAdminOrgQueue,
  adminReviewOrg
} from './controller';
import {
  validateCreateOrg,
  validateInviteFarmer,
  validateBulkImportFarmers,
  validateAddTeamMember,
  validateOrgReview
} from './validations';
import { authenticate } from '../auth/middleware';
import { requireOrgAccess } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

// Organization Setup & Profile (Screen O01, O02, O03)
router.post('/', authenticate, validateCreateOrg, createOrg);
router.get('/my-organization', authenticate, getMyOrganization);
router.get('/my-developer', authenticate, getMyOrganization);
router.get('/:id', authenticate, requireOrgAccess, getOrgDetails);
router.put('/:id', authenticate, requireOrgAccess, updateOrg);
router.post('/:id/submit', authenticate, requireOrgAccess, submitOrgForVerification);
router.get('/:id/dashboard', authenticate, requireOrgAccess, getOrgDashboard);

// Farmer Management (Screen O05, O06, O08)
router.post('/:id/farmers/invite', authenticate, requireOrgAccess, validateInviteFarmer, inviteFarmer);
router.post('/:id/farmers/bulk-import', authenticate, requireOrgAccess, validateBulkImportFarmers, bulkImportFarmers);
router.get('/:id/farmers', authenticate, requireOrgAccess, getOrgFarmers);

// Team Members Management (Screen O20)
router.post('/:id/members', authenticate, requireOrgAccess, validateAddTeamMember, addTeamMember);
router.get('/:id/members', authenticate, requireOrgAccess, getOrgMembers);
router.delete('/:id/members/:memberId', authenticate, requireOrgAccess, removeTeamMember);

// Super Admin Review Queue (Screen A04)
router.get('/admin/queue', authenticate, requireRole(['admin']), getAdminOrgQueue);
router.patch('/admin/:id/review', authenticate, requireRole(['admin']), validateOrgReview, adminReviewOrg);

export default router;
