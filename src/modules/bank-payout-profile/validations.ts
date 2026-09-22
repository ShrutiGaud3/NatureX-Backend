import { Request, Response, NextFunction } from 'express';

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACC_NUM_REGEX = /^\d{9,18}$/;
const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

export const validateBankProfile = (req: Request, res: Response, next: NextFunction): void => {
  const { accountHolderName, accountNumber, confirmAccountNumber, ifscCode, accountType, upiId } = req.body;

  if (!accountHolderName || typeof accountHolderName !== 'string' || accountHolderName.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'Account Holder Name is required.'
    });
    return;
  }

  if (!accountNumber || typeof accountNumber !== 'string' || !ACC_NUM_REGEX.test(accountNumber.trim())) {
    res.status(400).json({
      success: false,
      message: 'Valid bank account number is required (9 to 18 digits).'
    });
    return;
  }

  if (confirmAccountNumber && confirmAccountNumber.trim() !== accountNumber.trim()) {
    res.status(400).json({
      success: false,
      message: 'Account number and Confirm Account number do not match.'
    });
    return;
  }

  if (!ifscCode || typeof ifscCode !== 'string' || !IFSC_REGEX.test(ifscCode.trim().toUpperCase())) {
    res.status(400).json({
      success: false,
      message: 'Valid 11-character Indian IFSC code is required (e.g., SBIN0001234).'
    });
    return;
  }

  if (accountType && !['savings', 'current'].includes(accountType)) {
    res.status(400).json({
      success: false,
      message: 'Account type must be either "savings" or "current".'
    });
    return;
  }

  if (upiId && !UPI_REGEX.test(upiId.trim())) {
    res.status(400).json({
      success: false,
      message: 'Invalid UPI ID format (e.g., username@bank).'
    });
    return;
  }

  next();
};

export const validateReviewBankProfile = (req: Request, res: Response, next: NextFunction): void => {
  const { action, reason } = req.body;
  if (!action || !['verify', 'reject'].includes(action)) {
    res.status(400).json({
      success: false,
      message: 'Action must be either "verify" or "reject".'
    });
    return;
  }

  if (action === 'reject' && (!reason || reason.trim().length === 0)) {
    res.status(400).json({
      success: false,
      message: 'Rejection reason is mandatory when rejecting bank profile.'
    });
    return;
  }

  next();
};

