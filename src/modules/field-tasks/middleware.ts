import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { FieldTask } from './model';

export const checkTaskAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userRole = req.user?.role;
    if (userRole === 'admin' || userRole === 'project_developer' || userRole === 'organization') {
      return next();
    }

    const taskId = req.params.id || req.body.taskId;
    if (!taskId) return next();

    const task = await FieldTask.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, message: 'Field task not found.' });
      return;
    }

    if (task.assignedTo.toString() !== req.user?.id) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You are not assigned to this field task.'
      });
      return;
    }

    (req as any).fieldTask = task;
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkTaskModifiable = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = (req as any).fieldTask || (await FieldTask.findById(req.params.id || req.body.taskId));
    if (!task) {
      res.status(404).json({ success: false, message: 'Field task not found.' });
      return;
    }

    if (task.status === 'verified' && req.user?.role !== 'admin') {
      res.status(400).json({
        success: false,
        message: 'Verified field tasks cannot be modified without Admin authorization.'
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

