import { Request, Response, NextFunction } from 'express';

export const validateCreateNotification = (req: Request, res: Response, next: NextFunction): void => {
  const { recipientUserId, eventGroup, title, message } = req.body;
  if (!recipientUserId || !eventGroup || !title || !message) {
    res.status(400).json({ success: false, message: 'recipientUserId, eventGroup, title, and message are required' });
    return;
  }
  next();
};
