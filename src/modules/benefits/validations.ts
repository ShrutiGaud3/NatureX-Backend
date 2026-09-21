import { Request, Response, NextFunction } from 'express';

export const validateCreateBenefit = (req: Request, res: Response, next: NextFunction): void => {
  const { userId, projectId, amount, benefitType } = req.body;
  if (!userId || !projectId || amount === undefined || !benefitType) {
    res.status(400).json({ success: false, message: 'userId, projectId, amount, and benefitType are required' });
    return;
  }
  next();
};

export const validateUpdatePayoutStatus = (req: Request, res: Response, next: NextFunction): void => {
  const { status, reconciliationReference } = req.body;
  if (!status || !['approved', 'initiated', 'paid', 'failed', 'reversed'].includes(status)) {
    res.status(400).json({ success: false, message: 'Valid status is required' });
    return;
  }
  if (status === 'paid' && !reconciliationReference) {
    res.status(400).json({ success: false, message: 'Reconciliation reference is mandatory when marking as paid' });
    return;
  }
  next();
};
