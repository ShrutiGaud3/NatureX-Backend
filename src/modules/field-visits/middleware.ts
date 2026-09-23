import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { FieldVisit } from './model';

export const requireAssignedAgentOrAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userRole = req.user?.role;
    if (userRole === 'admin' || userRole === 'project_developer' || userRole === 'organization') {
      return next();
    }

    const visitId = req.params.id || req.body.visitId;
    if (!visitId) return next();

    const visit = await FieldVisit.findById(visitId);
    if (!visit) {
      res.status(404).json({ success: false, message: 'Field visit not found.' });
      return;
    }

    if (visit.assignedAgentId.toString() !== req.user?.id) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You are not the assigned field agent for this visit.'
      });
      return;
    }

    (req as any).fieldVisit = visit;
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkVisitActionable = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const visit = (req as any).fieldVisit || (await FieldVisit.findById(req.params.id || req.body.visitId));
    if (!visit) {
      res.status(404).json({ success: false, message: 'Field visit not found.' });
      return;
    }

    if (visit.status === 'completed') {
      res.status(400).json({ success: false, message: 'This field visit has already been completed.' });
      return;
    }

    if (visit.status === 'cancelled') {
      res.status(400).json({ success: false, message: 'This field visit has been cancelled and cannot be modified.' });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

