import { Request, Response, NextFunction } from 'express';

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  const role = user?.role;
  const roles = user?.roles || [];

  const isSuperAdmin =
    role === 'admin' ||
    role === 'super_admin' ||
    roles.includes('admin') ||
    roles.includes('super_admin');

  if (!isSuperAdmin) {
    res.status(403).json({
      success: false,
      message: 'Access denied: Super Admin console privileges required'
    });
    return;
  }
  next();
};
