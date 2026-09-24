import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { ReviewFinding } from './model';

export const checkReviewerAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userRole = req.user?.role;
    if (['admin', 'project_developer', 'organization', 'field_agent'].includes(userRole || '')) {
      return next();
    }

    const findingId = req.params.id;
    if (!findingId) return next();

    const finding = await ReviewFinding.findById(findingId);
    if (!finding) {
      res.status(404).json({ success: false, message: 'Review finding record not found.' });
      return;
    }

    (req as any).reviewFinding = finding;
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkFindingModifiable = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const finding = (req as any).reviewFinding || (await ReviewFinding.findById(req.params.id));
    if (!finding) {
      res.status(404).json({ success: false, message: 'Review finding record not found.' });
      return;
    }

    if (finding.status === 'closed' && req.user?.role !== 'admin') {
      res.status(400).json({
        success: false,
        message: 'This audit finding has been closed and cannot accept further responses without reopening.'
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

