import { Request, Response, NextFunction } from 'express';

export const checkVerificationLock = (req: Request, res: Response, next: NextFunction): void => {
  next();
};
