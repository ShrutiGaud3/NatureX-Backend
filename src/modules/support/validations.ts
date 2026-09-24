import { Request, Response, NextFunction } from 'express';

const VALID_CATEGORIES = [
  'kyc',
  'land_boundary',
  'payout_issue',
  'mrv_audit',
  'field_visit',
  'app_issue',
  'program_enrollment',
  'general_inquiry'
];

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES = ['open', 'in_progress', 'waiting_on_farmer', 'resolved', 'closed'];

export const validateCreateTicket = (req: Request, res: Response, next: NextFunction): void => {
  const { category, subject, description, priority } = req.body;

  if (!category || !VALID_CATEGORIES.includes(category)) {
    res.status(400).json({
      success: false,
      message: `category is required and must be one of: ${VALID_CATEGORIES.join(', ')}`
    });
    return;
  }

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    res.status(400).json({ success: false, message: 'Ticket subject is required' });
    return;
  }

  if (!description || typeof description !== 'string' || !description.trim()) {
    res.status(400).json({ success: false, message: 'Ticket description is required' });
    return;
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    res.status(400).json({
      success: false,
      message: `priority must be one of: ${VALID_PRIORITIES.join(', ')}`
    });
    return;
  }

  next();
};

export const validateReplyTicket = (req: Request, res: Response, next: NextFunction): void => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ success: false, message: 'Reply message is required' });
    return;
  }

  next();
};

export const validateResolveTicket = (req: Request, res: Response, next: NextFunction): void => {
  const { resolutionSummary } = req.body;

  if (!resolutionSummary || typeof resolutionSummary !== 'string' || !resolutionSummary.trim()) {
    res.status(400).json({ success: false, message: 'resolutionSummary is required to resolve ticket' });
    return;
  }

  next();
};

export const validateRateTicket = (req: Request, res: Response, next: NextFunction): void => {
  const { satisfactionRating, feedbackNotes } = req.body;

  if (
    satisfactionRating === undefined ||
    typeof satisfactionRating !== 'number' ||
    satisfactionRating < 1 ||
    satisfactionRating > 5
  ) {
    res.status(400).json({
      success: false,
      message: 'satisfactionRating is required and must be an integer between 1 and 5'
    });
    return;
  }

  next();
};

export const validateAssignTicket = (req: Request, res: Response, next: NextFunction): void => {
  const { assignedTo } = req.body;

  if (!assignedTo) {
    res.status(400).json({ success: false, message: 'assignedTo user ID is required' });
    return;
  }

  next();
};
