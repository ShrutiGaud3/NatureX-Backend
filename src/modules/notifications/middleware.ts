import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Notification } from './model';

export const requireNotificationAccess = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  if (!user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  next();
};

export const canAccessNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid notification ID' });
      return;
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    const isAdmin =
      user?.role === 'admin' ||
      user?.role === 'super_admin' ||
      user?.roles?.includes('admin') ||
      user?.roles?.includes('super_admin');

    const isOwner = userId && notification.recipientUserId.toString() === userId.toString();

    if (!isAdmin && !isOwner) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You cannot view or modify another user’s notification'
      });
      return;
    }

    (req as any).notification = notification;
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
