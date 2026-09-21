import { Request, Response, NextFunction } from 'express';

export const validateCreateFinding = (req: Request, res: Response, next: NextFunction): void => {
  const { projectId, entityType, entityId, title, description } = req.body;
  if (!projectId || !entityType || !entityId || !title || !description) {
    res.status(400).json({ success: false, message: 'projectId, entityType, entityId, title, and description are required' });
    return;
  }
  next();
};
