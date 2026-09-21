import { Request, Response, NextFunction } from 'express';

export const validateCreateVerification = (req: Request, res: Response, next: NextFunction): void => {
  const { projectId, assignedAgencyName } = req.body;
  if (!projectId || !assignedAgencyName) {
    res.status(400).json({ success: false, message: 'projectId and assignedAgencyName are required' });
    return;
  }
  next();
};

export const validateVerificationDecision = (req: Request, res: Response, next: NextFunction): void => {
  const { status } = req.body;
  if (!status || !['approved', 'rejected'].includes(status)) {
    res.status(400).json({ success: false, message: 'Valid decision status (approved, rejected) is required' });
    return;
  }
  next();
};
