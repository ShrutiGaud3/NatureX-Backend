import { Request, Response, NextFunction } from 'express';

export const validateMrvRecord = (req: Request, res: Response, next: NextFunction): void => {
  const { projectId, baselineValue, measuredValue } = req.body;
  if (!projectId || baselineValue === undefined || measuredValue === undefined) {
    res.status(400).json({ success: false, message: 'projectId, baselineValue, and measuredValue are required' });
    return;
  }
  next();
};
