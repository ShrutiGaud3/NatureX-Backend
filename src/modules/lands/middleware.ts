import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { Land } from './model';

export const requireLandOwnerOrAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'admin') {
      return next();
    }
    const land = await Land.findById(req.params.id);
    if (!land) {
      res.status(404).json({ success: false, message: 'Land not found' });
      return;
    }
    if (land.userId.toString() !== req.user?.id) {
      res.status(403).json({ success: false, message: 'Access denied: you do not own this land record' });
      return;
    }
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
