import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { SupportTicket } from './model';

export const requireSupportStaff = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  const role = user?.role;
  const roles = user?.roles || [];

  const isAuthorized =
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'support_agent' ||
    role === 'project_developer' ||
    roles.includes('admin') ||
    roles.includes('super_admin') ||
    roles.includes('support_agent');

  if (!isAuthorized) {
    res.status(403).json({
      success: false,
      message: 'Access denied: Support staff or administrator privileges required'
    });
    return;
  }
  next();
};

export const canAccessTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid ticket ID' });
      return;
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Support ticket not found' });
      return;
    }

    const isAdmin =
      user?.role === 'admin' ||
      user?.role === 'super_admin' ||
      user?.roles?.includes('admin') ||
      user?.roles?.includes('super_admin');

    const isOwner = userId && ticket.userId.toString() === userId.toString();
    const isAssigned = userId && ticket.assignedTo && ticket.assignedTo.toString() === userId.toString();

    if (!isAdmin && !isOwner && !isAssigned) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view or manage this support ticket'
      });
      return;
    }

    (req as any).ticket = ticket;
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
