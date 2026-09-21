import { Request, Response, NextFunction } from 'express';

export const validateAuditQuery = (req: Request, res: Response, next: NextFunction): void => {
  next();
};
