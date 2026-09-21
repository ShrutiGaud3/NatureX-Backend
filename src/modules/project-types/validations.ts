import { Request, Response, NextFunction } from 'express';

export const validateProjectType = (req: Request, res: Response, next: NextFunction): void => {
  const { key, name } = req.body;
  if (!key || !name) {
    res.status(400).json({ success: false, message: 'Key and name are required for project type' });
    return;
  }
  next();
};
