import { Request, Response, NextFunction } from 'express';

export const checkReviewerAccess = (req: Request, res: Response, next: NextFunction): void => {
  next();
};
