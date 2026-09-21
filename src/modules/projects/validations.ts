import { Request, Response, NextFunction } from 'express';

export const validateCreateProject = (req: Request, res: Response, next: NextFunction): void => {
  const { name, projectType, landId } = req.body;
  if (!name || !projectType || !landId) {
    res.status(400).json({ success: false, message: 'Project name, projectType (carbon/water/biodiversity), and landId are required' });
    return;
  }
  if (!['carbon', 'water', 'biodiversity'].includes(projectType)) {
    res.status(400).json({ success: false, message: 'Invalid projectType. Allowed: carbon, water, biodiversity' });
    return;
  }
  next();
};

export const validateProjectReview = (req: Request, res: Response, next: NextFunction): void => {
  const { action, reason, question } = req.body;
  if (!action) {
    res.status(400).json({ success: false, message: 'Review action is required' });
    return;
  }
  if (action === 'reject' && !reason) {
    res.status(400).json({ success: false, message: 'Rejection reason is required' });
    return;
  }
  if (action === 'clarify' && !question) {
    res.status(400).json({ success: false, message: 'Clarification question is required' });
    return;
  }
  next();
};
