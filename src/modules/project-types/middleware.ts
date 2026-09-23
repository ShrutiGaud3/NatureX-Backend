import { Request, Response, NextFunction } from 'express';
import { ProjectType } from './model';

export const requireActiveProjectType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const projectTypeKey = req.body.projectType || req.query.projectType || req.params.keyOrId;
    if (!projectTypeKey) {
      return next();
    }

    const type = await ProjectType.findOne({
      $or: [
        { key: String(projectTypeKey).toLowerCase() },
        ...(String(projectTypeKey).match(/^[0-9a-fA-F]{24}$/) ? [{ _id: projectTypeKey }] : [])
      ]
    });

    if (!type || !type.isActive) {
      res.status(400).json({
        success: false,
        message: `Project type '${projectTypeKey}' is either invalid or inactive.`
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

