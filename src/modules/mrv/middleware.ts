import { Request, Response, NextFunction } from 'express';

export const checkMrvAccess = (req: Request, res: Response, next: NextFunction): void => {
  next();
};
