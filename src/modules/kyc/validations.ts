import { Request, Response, NextFunction } from 'express';

const VALID_DOC_TYPES = ['aadhaar', 'pan', 'voter_id', 'driving_license', 'passport'];

export const validateKycDraft = (req: Request, res: Response, next: NextFunction): void => {
  const { documentType } = req.body;
  if (documentType && !VALID_DOC_TYPES.includes(documentType)) {
    res.status(400).json({
      success: false,
      message: `Invalid documentType. Must be one of: ${VALID_DOC_TYPES.join(', ')}`
    });
    return;
  }
  next();
};

export const validateKycSubmission = (req: Request, res: Response, next: NextFunction): void => {
  const { documentType, documentNumber, frontImageUrl, consentAgreed } = req.body;

  if (!documentType || !VALID_DOC_TYPES.includes(documentType)) {
    res.status(400).json({
      success: false,
      message: `Valid documentType is required: ${VALID_DOC_TYPES.join(', ')}`
    });
    return;
  }

  if (!documentNumber || typeof documentNumber !== 'string' || documentNumber.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'Document number is required.'
    });
    return;
  }

  if (!frontImageUrl || typeof frontImageUrl !== 'string' || frontImageUrl.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'Front image URL of the KYC document is required.'
    });
    return;
  }

  if (consentAgreed !== true) {
    res.status(400).json({
      success: false,
      message: 'Explicit user consent (consentAgreed: true) is mandatory to submit KYC.'
    });
    return;
  }

  next();
};

export const validateKycReview = (req: Request, res: Response, next: NextFunction): void => {
  const { action, reason, question } = req.body;
  const validActions = ['approve', 'reject', 'clarify', 'suspend'];

  if (!action || !validActions.includes(action)) {
    res.status(400).json({
      success: false,
      message: `Review action must be one of: ${validActions.join(', ')}`
    });
    return;
  }

  if (action === 'reject' && (!reason || reason.trim().length === 0)) {
    res.status(400).json({
      success: false,
      message: 'Rejection reason is mandatory when rejecting KYC.'
    });
    return;
  }

  if (action === 'clarify' && (!question || question.trim().length === 0)) {
    res.status(400).json({
      success: false,
      message: 'Clarification question is mandatory when asking for clarification.'
    });
    return;
  }

  next();
};

export const validateClarificationReply = (req: Request, res: Response, next: NextFunction): void => {
  const { reply } = req.body;
  if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'Clarification reply text is required.'
    });
    return;
  }
  next();
};

