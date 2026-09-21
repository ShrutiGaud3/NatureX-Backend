import { Request, Response, NextFunction } from 'express';

export const validateCreateProgram = (req: Request, res: Response, next: NextFunction): void => {
  const { name, sponsorName } = req.body;
  if (!name || !sponsorName) {
    res.status(400).json({ success: false, message: 'Program name and sponsorName are required' });
    return;
  }
  next();
};
