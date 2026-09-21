import { Request, Response, NextFunction } from 'express';

export const validateAnswerSubmission = (req: Request, res: Response, next: NextFunction): void => {
  const { projectId, answers } = req.body;
  if (!projectId || !answers || typeof answers !== 'object') {
    res.status(400).json({ success: false, message: 'projectId and answers object are required' });
    return;
  }
  next();
};
