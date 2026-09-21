import { Request, Response, NextFunction } from 'express';

export const validateCreateLand = (req: Request, res: Response, next: NextFunction): void => {
  const { landName, village, district, state } = req.body;
  if (!landName || !village || !district || !state) {
    res.status(400).json({ success: false, message: 'Land name, village, district, and state are required' });
    return;
  }
  next();
};

export const validateLandReview = (req: Request, res: Response, next: NextFunction): void => {
  const { action, reason, question } = req.body;
  if (!action || !['approve', 'reject', 'clarify', 'conflict'].includes(action)) {
    res.status(400).json({ success: false, message: 'Valid action (approve, reject, clarify, conflict) is required' });
    return;
  }
  if (action === 'reject' && !reason) {
    res.status(400).json({ success: false, message: 'Rejection reason is mandatory' });
    return;
  }
  if (action === 'clarify' && !question) {
    res.status(400).json({ success: false, message: 'Clarification question is mandatory' });
    return;
  }
  next();
};
