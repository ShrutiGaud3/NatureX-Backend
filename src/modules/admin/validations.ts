import { Request, Response, NextFunction } from 'express';

export const validateAdminConfig = (req: Request, res: Response, next: NextFunction): void => {
  const { configKey, configValue } = req.body;
  if (!configKey || configValue === undefined) {
    res.status(400).json({ success: false, message: 'configKey and configValue are required' });
    return;
  }
  next();
};
