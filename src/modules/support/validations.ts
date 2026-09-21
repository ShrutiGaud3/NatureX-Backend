import { Request, Response, NextFunction } from 'express';

export const validateCreateTicket = (req: Request, res: Response, next: NextFunction): void => {
  const { category, subject, message } = req.body;
  if (!category || !subject || !message) {
    res.status(400).json({ success: false, message: 'Category, subject, and message are required' });
    return;
  }
  next();
};

export const validateReplyTicket = (req: Request, res: Response, next: NextFunction): void => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    res.status(400).json({ success: false, message: 'Reply message is required' });
    return;
  }
  next();
};
