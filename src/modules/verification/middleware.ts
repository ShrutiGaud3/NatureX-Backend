import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { VerificationCase } from './model';

export const requireVerifierOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  const role = user?.role;
  const roles = user?.roles || [];

  const isAuthorized =
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'reviewer' ||
    role === 'auditor' ||
    role === 'project_developer' ||
    roles.includes('admin') ||
    roles.includes('super_admin') ||
    roles.includes('reviewer') ||
    roles.includes('auditor');

  if (!isAuthorized) {
    res.status(403).json({
      success: false,
      message: 'Access denied: Auditor, verifier, or administrator credentials required'
    });
    return;
  }
  next();
};

export const checkVerificationLock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid verification ID' });
      return;
    }

    const vCase = await VerificationCase.findById(id);
    if (!vCase) {
      res.status(404).json({ success: false, message: 'Verification case not found' });
      return;
    }

    if (vCase.isLocked && req.method !== 'GET') {
      res.status(403).json({
        success: false,
        message: 'This verification case has been locked and certified. Modification is restricted.'
      });
      return;
    }

    (req as any).verificationCase = vCase;
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
