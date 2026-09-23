import { Request, Response, NextFunction } from 'express';

const VALID_VISIT_TYPES = [
  'baseline_survey',
  'soil_sampling',
  'drone_monitoring',
  'practice_verification',
  'farmer_training',
  'grievance_inspection',
  'annual_audit'
];

export const validateCreateVisit = (req: Request, res: Response, next: NextFunction): void => {
  const { projectId, landId, assignedAgentId, scheduledDate, visitType } = req.body;

  if (!projectId || typeof projectId !== 'string') {
    res.status(400).json({ success: false, message: 'Valid projectId is required.' });
    return;
  }

  if (!landId || typeof landId !== 'string') {
    res.status(400).json({ success: false, message: 'Valid landId is required.' });
    return;
  }

  if (!assignedAgentId || typeof assignedAgentId !== 'string') {
    res.status(400).json({ success: false, message: 'Valid assignedAgentId is required.' });
    return;
  }

  if (!scheduledDate || isNaN(Date.parse(scheduledDate))) {
    res.status(400).json({ success: false, message: 'Valid scheduledDate (ISO string or timestamp) is required.' });
    return;
  }

  if (visitType && !VALID_VISIT_TYPES.includes(visitType)) {
    res.status(400).json({
      success: false,
      message: `Invalid visitType. Allowed types: ${VALID_VISIT_TYPES.join(', ')}`
    });
    return;
  }

  next();
};

export const validateStartVisit = (req: Request, res: Response, next: NextFunction): void => {
  const { checkInLocation } = req.body;

  if (checkInLocation) {
    const { latitude, longitude } = checkInLocation;
    if (
      latitude !== undefined &&
      (isNaN(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90)
    ) {
      res.status(400).json({ success: false, message: 'Latitude must be between -90 and 90.' });
      return;
    }
    if (
      longitude !== undefined &&
      (isNaN(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180)
    ) {
      res.status(400).json({ success: false, message: 'Longitude must be between -180 and 180.' });
      return;
    }
  }

  next();
};

export const validateCompleteVisit = (req: Request, res: Response, next: NextFunction): void => {
  const { checklist, measurements } = req.body;

  if (checklist && !Array.isArray(checklist)) {
    res.status(400).json({ success: false, message: 'checklist must be an array of checklist items.' });
    return;
  }

  if (measurements && !Array.isArray(measurements)) {
    res.status(400).json({ success: false, message: 'measurements must be an array of measurement items.' });
    return;
  }

  next();
};

export const validateRescheduleVisit = (req: Request, res: Response, next: NextFunction): void => {
  const { scheduledDate } = req.body;

  if (!scheduledDate || isNaN(Date.parse(scheduledDate))) {
    res.status(400).json({ success: false, message: 'New valid scheduledDate is required to reschedule visit.' });
    return;
  }

  next();
};

export const validateCancelVisit = (req: Request, res: Response, next: NextFunction): void => {
  const { reason } = req.body;

  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    res.status(400).json({ success: false, message: 'Cancellation reason is mandatory.' });
    return;
  }

  next();
};

export const validateSyncVisit = (req: Request, res: Response, next: NextFunction): void => {
  const { visitId, idempotencyKey } = req.body;

  if (!visitId || !idempotencyKey) {
    res.status(400).json({
      success: false,
      message: 'visitId and idempotencyKey are required for offline sync.'
    });
    return;
  }

  next();
};

