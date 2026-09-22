import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { Role } from './model';

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied: Requires one of [${allowedRoles.join(', ')}] role.`
      });
      return;
    }
    next();
  };
};

export const requirePermission = (requiredPermission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      // Super Admin always has full access
      if (req.user.role === 'admin') {
        return next();
      }

      const roleDoc = await Role.findOne({ key: req.user.role, isActive: true });
      if (!roleDoc || !roleDoc.permissions.includes(requiredPermission)) {
        res.status(403).json({
          success: false,
          message: `Access denied: Missing '${requiredPermission}' permission.`
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
};
