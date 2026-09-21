import { Request, Response, NextFunction } from 'express';

export const validateCreateTask = (req: Request, res: Response, next: NextFunction): void => {
  const { title, projectId, assignedTo, dueDate } = req.body;
  if (!title || !projectId || !assignedTo || !dueDate) {
    res.status(400).json({ success: false, message: 'Title, projectId, assignedTo, and dueDate are required' });
    return;
  }
  next();
};
