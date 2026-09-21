import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { KYC } from './model';

export const requireApprovedKyc = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'admin') {
      return next();
    }
    const kyc = await KYC.findOne({ userId: req.user?.id, status: 'approved' });
    if (!kyc) {
      res.status(403).json({
        success: false,
        message: 'KYC approval required before accessing this workflow stage'
      });
      return;
    }
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
