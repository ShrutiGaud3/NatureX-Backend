import { Request, Response, NextFunction } from 'express';

export const validateCreateTemplate = (req: Request, res: Response, next: NextFunction): void => {
  const { projectType, title, sections } = req.body;

  if (!projectType || typeof projectType !== 'string' || projectType.trim().length === 0) {
    res.status(400).json({ success: false, message: 'projectType is required (e.g. carbon, water, agroforestry)' });
    return;
  }

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ success: false, message: 'Template title is required' });
    return;
  }

  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    res.status(400).json({ success: false, message: 'Template must contain at least one section' });
    return;
  }

  next();
};

export const validateAnswerSubmission = (req: Request, res: Response, next: NextFunction): void => {
  const { projectId, answers } = req.body;

  if (!projectId) {
    res.status(400).json({ success: false, message: 'projectId is required' });
    return;
  }

  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    res.status(400).json({ success: false, message: 'answers must be a key-value object of question responses' });
    return;
  }

  next();
};

export const validateReviewAnswers = (req: Request, res: Response, next: NextFunction): void => {
  const { action, notes } = req.body;
  const validActions = ['approve', 'clarify', 'reject'];

  if (!action || !validActions.includes(action)) {
    res.status(400).json({
      success: false,
      message: `Review action must be one of: ${validActions.join(', ')}`
    });
    return;
  }

  next();
};

