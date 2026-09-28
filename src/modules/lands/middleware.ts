import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { Land } from './model';

import mongoose from 'mongoose';

export const requireLandOwnerOrAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'admin' || req.user?.role === 'super_admin') {
      return next();
    }
    const landId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(landId)) {
      res.status(404).json({ success: false, message: 'Land parcel not found.' });
      return;
    }
    const land = await Land.findById(landId);
    if (!land) {
      res.status(404).json({ success: false, message: 'Land parcel not found.' });
      return;
    }
    const isOwner = land.userId.toString() === req.user?.id;
    const isOrgManager = land.organizationId && req.user?.organizationId && land.organizationId.toString() === req.user.organizationId;

    if (!isOwner && !isOrgManager) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You do not own or manage this land parcel.'
      });
      return;
    }
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requireApprovedLand = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'admin' || req.user?.role === 'super_admin') {
      return next();
    }
    const landId = req.params.id || req.body.landId;
    if (!landId || !mongoose.Types.ObjectId.isValid(landId)) {
      res.status(400).json({ success: false, message: 'Valid Land ID is required' });
      return;
    }
    const land = await Land.findById(landId);
    if (!land || land.status !== 'approved') {
      res.status(403).json({
        success: false,
        message: 'This action requires an approved land parcel without unresolved conflicts.'
      });
      return;
    }
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

