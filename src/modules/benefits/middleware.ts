import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';

export const requireFinanceAccess = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Only finance / admin accounts can modify benefit statuses' });
    return;
  }
  next();
};
