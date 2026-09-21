import { Request, Response, NextFunction } from 'express';

export const validateGenerateReport = (req: Request, res: Response, next: NextFunction): void => {
  const { reportType } = req.body;
  if (!reportType) {
    res.status(400).json({ success: false, message: 'reportType is required' });
    return;
  }
  next();
};
