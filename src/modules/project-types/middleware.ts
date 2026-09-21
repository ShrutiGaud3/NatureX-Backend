import { Request, Response, NextFunction } from 'express';

export const requireActiveProjectType = (req: Request, res: Response, next: NextFunction): void => {
  next();
};
