import { Request, Response, NextFunction } from 'express';

export const validateRoleInput = (req: Request, res: Response, next: NextFunction): void => {
  const { name, key } = req.body;
  if (!name || !key) {
    res.status(400).json({ success: false, message: 'Role name and key are required' });
    return;
  }
  next();
};
