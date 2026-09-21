import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';

export const checkEvidenceUploadPermissions = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  next();
};
