import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';

export const requireAuditAccess = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Only super admins can view audit logs' });
    return;
  }
  next();
};
