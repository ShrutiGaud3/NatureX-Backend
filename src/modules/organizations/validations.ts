import { Request, Response, NextFunction } from 'express';

export const validateCreateOrg = (req: Request, res: Response, next: NextFunction): void => {
  const { name, type } = req.body;
  if (!name || !type) {
    res.status(400).json({ success: false, message: 'Organization name and valid type are required' });
    return;
  }
  next();
};

export const validateInviteMember = (req: Request, res: Response, next: NextFunction): void => {
  const { phone, role } = req.body;
  if (!phone || !role) {
    res.status(400).json({ success: false, message: 'Member phone and role are required' });
    return;
  }
  next();
};
