import { Request, Response, NextFunction } from 'express';

export const checkProgramEligibility = (req: Request, res: Response, next: NextFunction): void => {
  next();
};
