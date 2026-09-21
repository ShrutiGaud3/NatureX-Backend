import { Request, Response, NextFunction } from 'express';

export const validateSendOtp = (req: Request, res: Response, next: NextFunction): void => {
  const { phone } = req.body;
  if (!phone || typeof phone !== 'string' || !/^\d{10}$/.test(phone.trim())) {
    res.status(400).json({
      success: false,
      message: 'Valid 10-digit mobile phone number is required (e.g. 9876543210).'
    });
    return;
  }
  next();
};

export const validateVerifyOtp = (req: Request, res: Response, next: NextFunction): void => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    res.status(400).json({
      success: false,
      message: 'Phone and OTP are required.'
    });
    return;
  }
  if (typeof otp !== 'string' || otp.trim().length !== 4) {
    res.status(400).json({
      success: false,
      message: 'OTP must be a 4-digit numeric string.'
    });
    return;
  }
  next();
};

export const validateSelectRole = (req: Request, res: Response, next: NextFunction): void => {
  const { role } = req.body;
  if (!role || !['farmer', 'organization', 'field_agent'].includes(role)) {
    res.status(400).json({
      success: false,
      message: 'Valid role is required. Allowed options: farmer, organization, field_agent'
    });
    return;
  }
  next();
};
