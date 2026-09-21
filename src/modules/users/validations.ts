import { Request, Response, NextFunction } from 'express';

export const validateUpdateProfile = (req: Request, res: Response, next: NextFunction): void => {
  const { fullName, village, district, state, isDraft = false } = req.body;

  // If user is completing profile (not saving as draft), validate mandatory fields (Document Section 4.1 F06)
  if (!isDraft) {
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Full Name is required to complete profile.'
      });
      return;
    }
    if (!village || !district || !state) {
      res.status(400).json({
        success: false,
        message: 'Village, District, and State are mandatory to complete profile.'
      });
      return;
    }
  }

  next();
};

export const validateUpdateLanguage = (req: Request, res: Response, next: NextFunction): void => {
  const { language } = req.body;
  if (!language || !['en', 'hi'].includes(language)) {
    res.status(400).json({
      success: false,
      message: 'Language must be either "en" (English) or "hi" (Hindi).'
    });
    return;
  }
  next();
};

export const validateUpdateStatus = (req: Request, res: Response, next: NextFunction): void => {
  const { status } = req.body;
  if (!status || !['draft', 'submitted', 'active', 'suspended'].includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Valid status is required: draft, submitted, active, suspended'
    });
    return;
  }
  next();
};
