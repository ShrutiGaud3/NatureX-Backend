import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { BankProfile } from './model';

export const requireVerifiedBankProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'admin') {
      return next();
    }
    const profile = await BankProfile.findOne({ userId: req.user?.id, isVerified: true });
    if (!profile) {
      res.status(403).json({
        success: false,
        message: 'A verified bank payout profile is required before initiating payouts or benefit claims.'
      });
      return;
    }
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

