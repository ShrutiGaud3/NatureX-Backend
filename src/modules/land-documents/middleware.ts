import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { Land } from '../lands/model';
import { LandDocument } from './model';

export const requireDocumentAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'admin') {
      return next();
    }

    const landId = req.body.landId || req.params.landId;
    if (landId) {
      const land = await Land.findById(landId);
      if (!land) {
        res.status(404).json({ success: false, message: 'Land record not found' });
        return;
      }
      const isOwner = land.userId.toString() === req.user?.id;
      const isOrgManager = land.organizationId && req.user?.organizationId && land.organizationId.toString() === req.user.organizationId;
      if (!isOwner && !isOrgManager) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You do not own or manage this land record'
        });
        return;
      }
      return next();
    }

    const docId = req.params.id;
    if (docId) {
      const doc = await LandDocument.findById(docId);
      if (!doc) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }
      const isUploader = doc.userId.toString() === req.user?.id;
      const isOrgManager = doc.organizationId && req.user?.organizationId && doc.organizationId.toString() === req.user.organizationId;
      if (!isUploader && !isOrgManager) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to access this document'
        });
        return;
      }
      return next();
    }

    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

