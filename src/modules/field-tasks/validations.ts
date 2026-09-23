import { Request, Response, NextFunction } from 'express';

const VALID_TASK_TYPES = [
  'land_survey',
  'farmer_onboarding',
  'soil_collection',
  'tree_enumeration',
  'photo_evidence',
  'grievance_resolution',
  'mrv_audit_sample',
  'document_collection',
  'general'
];

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export const validateCreateTask = (req: Request, res: Response, next: NextFunction): void => {
  const { title, projectId, assignedTo, dueDate, taskType, priority } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ success: false, message: 'Task title is required.' });
    return;
  }

  if (!projectId || typeof projectId !== 'string') {
    res.status(400).json({ success: false, message: 'Valid projectId is required.' });
    return;
  }

  if (!assignedTo || typeof assignedTo !== 'string') {
    res.status(400).json({ success: false, message: 'Valid assignedTo (Field Agent ID) is required.' });
    return;
  }

  if (!dueDate || isNaN(Date.parse(dueDate))) {
    res.status(400).json({ success: false, message: 'Valid dueDate is required.' });
    return;
  }

  if (taskType && !VALID_TASK_TYPES.includes(taskType)) {
    res.status(400).json({
      success: false,
      message: `Invalid taskType. Allowed types: ${VALID_TASK_TYPES.join(', ')}`
    });
    return;
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    res.status(400).json({
      success: false,
      message: `Invalid priority. Allowed options: ${VALID_PRIORITIES.join(', ')}`
    });
    return;
  }

  next();
};

export const validateSubmitTask = (req: Request, res: Response, next: NextFunction): void => {
  const { completionNotes, submissionData, evidenceIds } = req.body;

  if (!completionNotes && !submissionData && (!evidenceIds || evidenceIds.length === 0)) {
    res.status(400).json({
      success: false,
      message: 'Submission must contain at least completionNotes, submissionData, or evidenceIds.'
    });
    return;
  }

  next();
};

export const validateVerifyTask = (req: Request, res: Response, next: NextFunction): void => {
  const { action, rejectionReason, notes } = req.body;
  const validActions = ['verify', 'reject', 'reopen'];

  if (!action || !validActions.includes(action)) {
    res.status(400).json({
      success: false,
      message: `Review action must be one of: ${validActions.join(', ')}`
    });
    return;
  }

  if (action === 'reject' && !rejectionReason && !notes) {
    res.status(400).json({
      success: false,
      message: 'Rejection reason or review notes are required when rejecting a task.'
    });
    return;
  }

  next();
};

