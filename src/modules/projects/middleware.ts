import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { Land } from '../lands/model';

export const checkLandApprovedBeforeProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { landId } = req.body;
    if (!landId) return next();

    const land = await Land.findById(landId);
    if (!land) {
      res.status(404).json({ success: false, message: 'Specified land not found' });
      return;
    }
    if (land.status !== 'approved') {
      res.status(400).json({
        success: false,
        message: 'Cannot create or submit project on unapproved land. Land must be approved first.'
      });
      return;
    }
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
