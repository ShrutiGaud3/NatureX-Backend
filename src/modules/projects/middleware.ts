import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { Land } from '../lands/model';
import { Project } from './model';

export const checkLandValidForProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { landId } = req.body;
    if (!landId) return next();

    const land = await Land.findById(landId);
    if (!land) {
      res.status(404).json({ success: false, message: 'Specified land parcel not found' });
      return;
    }

    if (land.hasConflict || land.status === 'conflict') {
      res.status(400).json({
        success: false,
        message: 'Cannot enroll a land parcel with unresolved boundary conflicts into a project.'
      });
      return;
    }
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requireProjectAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'admin') {
      return next();
    }

    const projectId = req.params.id || req.body.projectId;
    if (!projectId) {
      return next();
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const isOwner = project.userId.toString() === req.user?.id;
    const isOrgMember = project.organizationId && req.user?.organizationId && project.organizationId.toString() === req.user.organizationId;
    const isReviewer = project.assignedReviewerId?.toString() === req.user?.id || project.assignedAuditorId?.toString() === req.user?.id;

    if (!isOwner && !isOrgMember && !isReviewer) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You do not own or manage this project'
      });
      return;
    }
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

