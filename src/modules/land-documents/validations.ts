import { Request, Response, NextFunction } from 'express';

const VALID_DOC_TYPES = [
  'land_record',
  '7_12_extract',
  'khasra_khatauni',
  'lease_agreement',
  'consent_letter',
  'patta',
  'mutation_register',
  'noc_panchayat',
  'other'
];

export const validateDocumentUpload = (req: Request, res: Response, next: NextFunction): void => {
  const { landId, documentType, documentTitle, fileUrl } = req.body;

  if (!landId) {
    res.status(400).json({ success: false, message: 'landId is required' });
    return;
  }

  if (!documentType || !VALID_DOC_TYPES.includes(documentType)) {
    res.status(400).json({
      success: false,
      message: `documentType must be one of: ${VALID_DOC_TYPES.join(', ')}`
    });
    return;
  }

  if (!documentTitle || typeof documentTitle !== 'string' || documentTitle.trim().length === 0) {
    res.status(400).json({ success: false, message: 'documentTitle is required' });
    return;
  }

  if (!fileUrl || typeof fileUrl !== 'string' || fileUrl.trim().length === 0) {
    res.status(400).json({ success: false, message: 'fileUrl is required' });
    return;
  }

  next();
};

export const validateDocumentReview = (req: Request, res: Response, next: NextFunction): void => {
  const { action, reason, question } = req.body;
  const validActions = ['verify', 'reject', 'clarify'];

  if (!action || !validActions.includes(action)) {
    res.status(400).json({
      success: false,
      message: `Action must be one of: ${validActions.join(', ')}`
    });
    return;
  }

  if (action === 'reject' && (!reason || reason.trim().length === 0)) {
    res.status(400).json({
      success: false,
      message: 'Rejection reason is mandatory when rejecting document.'
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

