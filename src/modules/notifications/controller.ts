import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Notification } from './model';
import { User } from '../users/model';

// 1. Create Individual Notification
export const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const sender = (req as any).user;
    const senderId = sender?.id || sender?._id;
    const {
      recipientUserId,
      eventGroup,
      eventType,
      title,
      message,
      priority = 'medium',
      channel = 'in_app',
      deepLink,
      data,
      expiresAt
    } = req.body;

    const notification = await Notification.create({
      recipientUserId: new mongoose.Types.ObjectId(recipientUserId),
      senderUserId: senderId ? new mongoose.Types.ObjectId(senderId) : undefined,
      eventGroup,
      eventType,
      title,
      message,
      priority,
      channel,
      deepLink,
      data,
      isRead: false,
      isArchived: false,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Broadcast Notification to Multiple Users or Role
export const broadcastNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const sender = (req as any).user;
    const senderId = sender?.id || sender?._id;
    const {
      recipients,
      targetRole,
      eventGroup,
      eventType,
      title,
      message,
      priority = 'medium',
      channel = 'in_app',
      deepLink,
      data
    } = req.body;

    let targetUserIds: string[] = [];

    if (recipients && Array.isArray(recipients)) {
      targetUserIds = recipients;
    } else if (targetRole) {
      const users = await User.find({ role: targetRole }).select('_id');
      targetUserIds = users.map((u) => u._id.toString());
    }

    if (targetUserIds.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No recipients found matching the target criteria'
      });
      return;
    }

    const docs = targetUserIds.map((userId) => ({
      recipientUserId: new mongoose.Types.ObjectId(userId),
      senderUserId: senderId ? new mongoose.Types.ObjectId(senderId) : undefined,
      eventGroup,
      eventType,
      title,
      message,
      priority,
      channel,
      deepLink,
      data,
      isRead: false,
      isArchived: false
    }));

    const result = await Notification.insertMany(docs);

    res.status(201).json({
      success: true,
      message: `Notification broadcasted to ${result.length} recipients`,
      count: result.length,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Current User's Notifications
export const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const {
      isRead,
      eventGroup,
      priority,
      channel,
      search,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query: any = {
      recipientUserId: new mongoose.Types.ObjectId(userId),
      isArchived: false
    };

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    if (eventGroup) query.eventGroup = eventGroup;
    if (priority) query.priority = priority;
    if (channel) query.channel = channel;

    if (search) {
      query.$or = [
        { title: { $regex: search as string, $options: 'i' } },
        { message: { $regex: search as string, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;
    const sort: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('senderUserId', 'fullName email role phone')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Notification.countDocuments(query),
      Notification.countDocuments({
        recipientUserId: new mongoose.Types.ObjectId(userId),
        isRead: false,
        isArchived: false
      })
    ]);

    res.status(200).json({
      success: true,
      unreadCount,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: notifications
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Quick Unread Count for Badge
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const unreadCount = await Notification.countDocuments({
      recipientUserId: new mongoose.Types.ObjectId(userId),
      isRead: false,
      isArchived: false
    });

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Notification Stats & Analytics (Admin)
export const getNotificationStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalNotifications, unreadTotal, byEventGroup, byPriority] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ isRead: false }),
      Notification.aggregate([
        { $group: { _id: '$eventGroup', count: { $sum: 1 } } }
      ]),
      Notification.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalNotifications,
        unreadTotal,
        readTotal: totalNotifications - unreadTotal,
        byEventGroup,
        byPriority
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get Notification Details by ID
export const getNotificationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid notification ID' });
      return;
    }

    const notification = await Notification.findById(id)
      .populate('recipientUserId', 'fullName email role phone')
      .populate('senderUserId', 'fullName email role phone');

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Mark Single Notification as Read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid notification ID' });
      return;
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientUserId: new mongoose.Types.ObjectId(userId) },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Mark All Current User's Notifications as Read
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const result = await Notification.updateMany(
      { recipientUserId: new mongoose.Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Archive Notification
export const archiveNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid notification ID' });
      return;
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientUserId: new mongoose.Types.ObjectId(userId) },
      { $set: { isArchived: true } },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification archived successfully',
      data: notification
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Delete Notification
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid notification ID' });
      return;
    }

    const isAdmin =
      user?.role === 'admin' ||
      user?.role === 'super_admin' ||
      user?.roles?.includes('admin') ||
      user?.roles?.includes('super_admin');

    const query: any = { _id: id };
    if (!isAdmin) {
      query.recipientUserId = new mongoose.Types.ObjectId(userId);
    }

    const notification = await Notification.findOneAndDelete(query);

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found or access denied' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
