import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { Role } from './model';

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Phone 9999999999 is root Super Admin
    if (req.user.phone === '9999999999') {
      req.user.role = 'super_admin';
      return next();
    }

    const role = (req.user.role || '').toLowerCase();
    const isAdmin = role === 'admin' || role === 'super_admin';
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
    const isAllowed =
      normalizedAllowed.includes(role) ||
      (isAdmin && (normalizedAllowed.includes('admin') || normalizedAllowed.includes('super_admin')));

    if (!isAllowed) {
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

      // Super Admin and Admin always have full access
      if (req.user.phone === '9999999999' || req.user.role === 'admin' || req.user.role === 'super_admin') {
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
