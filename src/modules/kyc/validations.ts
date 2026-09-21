import { Request, Response, NextFunction } from 'express';

export const validateKycSubmission = (req: Request, res: Response, next: NextFunction): void => {
  const { documentType, documentNumber, frontImageUrl, consentAgreed } = req.body;
  if (!documentType || !documentNumber || !frontImageUrl) {
    res.status(400).json({ success: false, message: 'Document type, document number, and front image are required' });
    return;
  }
  if (!consentAgreed) {
    res.status(400).json({ success: false, message: 'Consent is mandatory before submitting KYC' });
    return;
  }
  next();
};

export const validateKycReview = (req: Request, res: Response, next: NextFunction): void => {
  const { action, reason, question } = req.body;
  if (!action || !['approve', 'reject', 'clarify', 'suspend'].includes(action)) {
    res.status(400).json({ success: false, message: 'Valid review action (approve, reject, clarify, suspend) is required' });
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
