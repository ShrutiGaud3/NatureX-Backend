import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../auth/middleware';
import { Evidence } from './model';

export const checkEvidenceAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const evidenceId = req.params.id;
    if (!evidenceId) return next();

    if (!mongoose.Types.ObjectId.isValid(evidenceId)) {
      res.status(404).json({ success: false, message: 'Evidence record not found.' });
      return;
    }

    const evidence = await Evidence.findById(evidenceId);
    if (!evidence) {
      res.status(404).json({ success: false, message: 'Evidence record not found.' });
      return;
    }

    // Admins and Field Agents have global read/review access
    if (['admin', 'super_admin', 'field_agent'].includes(req.user?.role || '')) {
      (req as any).evidence = evidence;
      return next();
    }

    // Owner check
    if (evidence.userId && evidence.userId.toString() === req.user?.id) {
      (req as any).evidence = evidence;
      return next();
    }

    res.status(403).json({
      success: false,
      message: 'You do not have permission to access or modify this evidence record.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkEvidenceEditable = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const evidenceId = req.params.id;
    if (evidenceId && !mongoose.Types.ObjectId.isValid(evidenceId)) {
      res.status(404).json({ success: false, message: 'Evidence record not found.' });
      return;
    }

    const evidence = (req as any).evidence || (evidenceId ? await Evidence.findById(evidenceId) : null);
    if (!evidence) {
      res.status(404).json({ success: false, message: 'Evidence record not found.' });
      return;
    }

    const isAdmin = ['admin', 'super_admin'].includes(req.user?.role || '');
    if (evidence.status === 'verified' && !isAdmin) {
      res.status(400).json({
        success: false,
        message: 'Verified evidence records cannot be modified or deleted without Admin authorization.'
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

