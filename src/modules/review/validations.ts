import { Request, Response, NextFunction } from 'express';

const VALID_ENTITY_TYPES = [
  'project',
  'land',
  'kyc',
  'evidence',
  'mrv',
  'questionnaire',
  'field_visit'
];

const VALID_SEVERITIES = ['minor', 'major', 'critical'];

export const validateCreateFinding = (req: Request, res: Response, next: NextFunction): void => {
  const { projectId, entityType, entityId, title, description, severity } = req.body;

  if (!projectId || typeof projectId !== 'string') {
    res.status(400).json({ success: false, message: 'Valid projectId is required.' });
    return;
  }

  if (!entityType || !VALID_ENTITY_TYPES.includes(entityType)) {
    res.status(400).json({
      success: false,
      message: `Valid entityType is required. Allowed types: ${VALID_ENTITY_TYPES.join(', ')}`
    });
    return;
  }

  if (!entityId || typeof entityId !== 'string') {
    res.status(400).json({ success: false, message: 'Valid entityId is required.' });
    return;
  }

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ success: false, message: 'Finding title is required.' });
    return;
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    res.status(400).json({ success: false, message: 'Finding description is required.' });
    return;
  }

  if (severity && !VALID_SEVERITIES.includes(severity)) {
    res.status(400).json({
      success: false,
      message: `severity must be one of: ${VALID_SEVERITIES.join(', ')}`
    });
    return;
  }

  next();
};

export const validateRespondFinding = (req: Request, res: Response, next: NextFunction): void => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json({ success: false, message: 'Clarification response message is required.' });
    return;
  }

  next();
};

export const validateResolveFinding = (req: Request, res: Response, next: NextFunction): void => {
  const { action } = req.body;
  const validActions = ['resolve', 'reopen', 'close'];

  if (!action || !validActions.includes(action)) {
    res.status(400).json({
      success: false,
      message: `Action must be one of: ${validActions.join(', ')}`
    });
    return;
  }

  next();
};

