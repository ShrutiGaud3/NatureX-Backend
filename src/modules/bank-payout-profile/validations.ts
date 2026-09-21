import { Request, Response, NextFunction } from 'express';

export const validateBankProfile = (req: Request, res: Response, next: NextFunction): void => {
  const { accountHolderName, accountNumber, ifscCode } = req.body;
  if (!accountHolderName || !accountNumber || !ifscCode) {
    res.status(400).json({ success: false, message: 'Account holder name, account number, and IFSC code are required' });
    return;
  }
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.trim().toUpperCase())) {
    res.status(400).json({ success: false, message: 'Invalid IFSC code format' });
    return;
  }
  next();
};
