import { Request, Response, NextFunction } from 'express';

const VALID_RESOURCE_TYPES = [
  'user',
  'kyc',
  'land',
  'project',
  'evidence',
  'mrv',
  'verification',
  'payout',
  'program',
  'benefit',
  'support',
  'system'
];

const VALID_SEVERITIES = ['info', 'warning', 'critical'];

export const validateCreateAuditLog = (req: Request, res: Response, next: NextFunction): void => {
  const { action, resourceType, resourceId, severity } = req.body;

  if (!action || typeof action !== 'string' || !action.trim()) {
    res.status(400).json({ success: false, message: 'action is required' });
    return;
  }

  if (!resourceType || !VALID_RESOURCE_TYPES.includes(resourceType)) {
    res.status(400).json({
      success: false,
      message: `resourceType is required and must be one of: ${VALID_RESOURCE_TYPES.join(', ')}`
    });
    return;
  }

  if (!resourceId || typeof resourceId !== 'string' || !resourceId.trim()) {
    res.status(400).json({ success: false, message: 'resourceId is required' });
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

export const validateAuditQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { resourceType, severity, startDate, endDate } = req.query;

  if (resourceType && !VALID_RESOURCE_TYPES.includes(resourceType as string)) {
    res.status(400).json({
      success: false,
      message: `Invalid resourceType. Allowed: ${VALID_RESOURCE_TYPES.join(', ')}`
    });
    return;
  }

  if (severity && !VALID_SEVERITIES.includes(severity as string)) {
    res.status(400).json({
      success: false,
      message: `Invalid severity. Allowed: ${VALID_SEVERITIES.join(', ')}`
    });
    return;
  }

  if (startDate && isNaN(Date.parse(startDate as string))) {
    res.status(400).json({ success: false, message: 'Invalid startDate format' });
    return;
  }

  if (endDate && isNaN(Date.parse(endDate as string))) {
    res.status(400).json({ success: false, message: 'Invalid endDate format' });
    return;
  }

  next();
};
