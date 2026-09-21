import { Response } from 'express';
import { Notification } from './model';
import { AuthRequest } from '../auth/middleware';

export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await Notification.find({ recipientUserId: req.user?.id }).sort({ createdAt: -1 });
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    res.status(200).json({ success: true, unreadCount, count: notifications.length, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientUserId: req.user?.id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { recipientUserId, eventGroup, title, message, deepLink, channel } = req.body;
    const notification = await Notification.create({
      recipientUserId,
      eventGroup,
      title,
      message,
      deepLink,
      channel
    });
    res.status(201).json({ success: true, message: 'Notification created', data: notification });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
