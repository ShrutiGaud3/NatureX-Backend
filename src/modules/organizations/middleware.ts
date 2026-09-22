import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { Organization } from './model';

export const requireOrgAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Super Admin has global access
    if (req.user.role === 'admin') {
      return next();
    }

    const orgId = req.params.id || req.body.organizationId || req.user.organizationId;
    if (!orgId) {
      res.status(403).json({ success: false, message: 'Organization scope is missing.' });
      return;
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found.' });
      return;
    }

    // Check if user is a member or creator
    const isCreator = org.createdBy.toString() === req.user.id;
    const isMember = org.members.some((m) => m.userId.toString() === req.user?.id);

    if (!isCreator && !isMember) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this organization.'
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requireApprovedOrg = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'admin') {
      return next();
    }

    const orgId = req.params.id || req.body.organizationId || req.user?.organizationId;
    const org = await Organization.findById(orgId);

    if (!org || org.status !== 'approved') {
      res.status(403).json({
        success: false,
        message: 'Action restricted: Organization must be verified and approved by Super Admin first.'
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
