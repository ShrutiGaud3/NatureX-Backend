import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { Land } from '../lands/model';

export const requireLandAccessForGis = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'admin') {
      return next();
    }
    const landId = req.body.landId || req.params.landId;
    if (!landId) {
      res.status(400).json({ success: false, message: 'landId is required' });
      return;
    }
    const land = await Land.findById(landId);
    if (!land) {
      res.status(404).json({ success: false, message: 'Land parcel not found' });
      return;
    }
    const isOwner = land.userId.toString() === req.user?.id;
    const isOrgManager = land.organizationId && req.user?.organizationId && land.organizationId.toString() === req.user.organizationId;

    if (!isOwner && !isOrgManager) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You do not own or manage this land parcel for GIS operations.'
      });
      return;
    }
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

