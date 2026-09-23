import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { MrvRecord } from './model';

export const checkMrvAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userRole = req.user?.role;
    if (['admin', 'project_developer', 'organization'].includes(userRole || '')) {
      return next();
    }

    const mrvId = req.params.id;
    if (!mrvId) return next();

    const record = await MrvRecord.findById(mrvId);
    if (!record) {
      res.status(404).json({ success: false, message: 'MRV report record not found.' });
      return;
    }

    (req as any).mrvRecord = record;
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkMrvEditable = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = (req as any).mrvRecord || (await MrvRecord.findById(req.params.id));
    if (!record) {
      res.status(404).json({ success: false, message: 'MRV report record not found.' });
      return;
    }

    if (record.status === 'verified' && req.user?.role !== 'admin') {
      res.status(400).json({
        success: false,
        message: 'Verified MRV reports cannot be edited without Admin authorization.'
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

