import { Request, Response, NextFunction } from 'express';

const VALID_BENEFIT_TYPES = [
  'carbon_incentive',
  'water_credit_share',
  'biodiversity_grant',
  'practice_incentive',
  'program_subsidy',
  'credit_sale_revenue'
];

const VALID_BENEFIT_STATUSES = [
  'pending',
  'approved',
  'initiated',
  'processing',
  'paid',
  'failed',
  'reversed'
];

const VALID_PAYOUT_METHODS = ['bank_transfer', 'upi', 'direct_debit', 'cheque'];

export const validateCreateBenefit = (req: Request, res: Response, next: NextFunction): void => {
  const { userId, projectId, amount, benefitType } = req.body;

  if (!userId) {
    res.status(400).json({ success: false, message: 'userId is required' });
    return;
  }

  if (!projectId) {
    res.status(400).json({ success: false, message: 'projectId is required' });
    return;
  }

  if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ success: false, message: 'amount must be a positive number' });
    return;
  }

  if (!benefitType || !VALID_BENEFIT_TYPES.includes(benefitType)) {
    res.status(400).json({
      success: false,
      message: `benefitType is required and must be one of: ${VALID_BENEFIT_TYPES.join(', ')}`
    });
    return;
  }

  next();
};

export const validateBulkCalculate = (req: Request, res: Response, next: NextFunction): void => {
  const { projectId, benefitType, allocations, ratePerAcre } = req.body;

  if (!projectId) {
    res.status(400).json({ success: false, message: 'projectId is required' });
    return;
  }

  if (!benefitType || !VALID_BENEFIT_TYPES.includes(benefitType)) {
    res.status(400).json({
      success: false,
      message: `benefitType is required and must be one of: ${VALID_BENEFIT_TYPES.join(', ')}`
    });
    return;
  }

  if (!allocations && (ratePerAcre === undefined || typeof ratePerAcre !== 'number' || ratePerAcre <= 0)) {
    res.status(400).json({
      success: false,
      message: 'Either a list of allocations or a valid positive ratePerAcre is required'
    });
    return;
  }

  if (allocations && (!Array.isArray(allocations) || allocations.length === 0)) {
    res.status(400).json({
      success: false,
      message: 'allocations must be a non-empty array when provided'
    });
    return;
  }

  next();
};

export const validateUpdatePayoutStatus = (req: Request, res: Response, next: NextFunction): void => {
  const { status, reconciliationReference, failureReason } = req.body;

  if (!status || !VALID_BENEFIT_STATUSES.includes(status)) {
    res.status(400).json({
      success: false,
      message: `status is required and must be one of: ${VALID_BENEFIT_STATUSES.join(', ')}`
    });
    return;
  }

  if (status === 'paid' && !reconciliationReference) {
    res.status(400).json({
      success: false,
      message: 'reconciliationReference or transaction reference is required when marking as paid'
    });
    return;
  }

  if (status === 'failed' && !failureReason) {
    res.status(400).json({
      success: false,
      message: 'failureReason is required when status is failed'
    });
    return;
  }

  next();
};

export const validateProcessPayout = (req: Request, res: Response, next: NextFunction): void => {
  const { payoutMethod, transactionReference } = req.body;

  if (payoutMethod && !VALID_PAYOUT_METHODS.includes(payoutMethod)) {
    res.status(400).json({
      success: false,
      message: `payoutMethod must be one of: ${VALID_PAYOUT_METHODS.join(', ')}`
    });
    return;
  }

  if (!transactionReference || typeof transactionReference !== 'string' || !transactionReference.trim()) {
    res.status(400).json({
      success: false,
      message: 'transactionReference (e.g. UTR / NEFT / IMPS reference) is required to process payout'
    });
    return;
  }

  next();
};
