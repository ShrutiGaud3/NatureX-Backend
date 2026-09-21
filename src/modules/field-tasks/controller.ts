import { Response } from 'express';
import { FieldTask } from './model';
import { AuthRequest } from '../auth/middleware';

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, projectId, assignedTo, dueDate, priority } = req.body;
    const task = await FieldTask.create({ title, description, projectId, assignedTo, dueDate, priority });
    res.status(201).json({ success: true, message: 'Task created successfully', data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query: any = req.user?.role === 'admin' ? {} : { assignedTo: req.user?.id };
    const tasks = await FieldTask.find(query).populate('projectId', 'name projectType').sort({ dueDate: 1 });
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const task = await FieldTask.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    res.status(200).json({ success: true, message: `Task status updated to ${status}`, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
