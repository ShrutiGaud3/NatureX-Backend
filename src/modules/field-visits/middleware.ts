import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { FieldVisit } from './model';

export const requireAssignedAgent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'admin') return next();

    const visitId = req.params.id || req.body.visitId;
    if (!visitId) return next();

    const visit = await FieldVisit.findById(visitId);
    if (!visit) {
      res.status(404).json({ success: false, message: 'Field visit not found' });
      return;
    }
    if (visit.assignedAgentId.toString() !== req.user?.id) {
      res.status(403).json({ success: false, message: 'Access denied: You are not assigned to this visit' });
      return;
    }
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
