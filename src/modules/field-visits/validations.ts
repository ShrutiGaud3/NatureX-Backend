import { Request, Response, NextFunction } from 'express';

export const validateCreateVisit = (req: Request, res: Response, next: NextFunction): void => {
  const { projectId, landId, assignedAgentId, scheduledDate } = req.body;
  if (!projectId || !landId || !assignedAgentId || !scheduledDate) {
    res.status(400).json({ success: false, message: 'projectId, landId, assignedAgentId, and scheduledDate are required' });
    return;
  }
  next();
};

export const validateSyncVisit = (req: Request, res: Response, next: NextFunction): void => {
  const { visitId, idempotencyKey } = req.body;
  if (!visitId || !idempotencyKey) {
    res.status(400).json({ success: false, message: 'visitId and idempotencyKey are required for offline sync' });
    return;
  }
  next();
};
