import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { Organization } from './model';

export const requireOrgAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'admin') {
      return next();
    }
    const orgId = req.params.orgId || req.body.organizationId || req.user?.organizationId;
    if (!orgId) {
      res.status(403).json({ success: false, message: 'Organization scope is missing' });
      return;
    }
    const org = await Organization.findById(orgId);
    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
