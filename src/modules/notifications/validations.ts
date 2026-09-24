import { Request, Response, NextFunction } from 'express';

const VALID_EVENT_GROUPS = [
  'account',
  'land',
  'project',
  'field',
  'evidence',
  'mrv',
  'verification',
  'program',
  'benefits',
  'support',
  'system'
];

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_CHANNELS = ['in_app', 'push', 'sms', 'email', 'all'];

export const validateCreateNotification = (req: Request, res: Response, next: NextFunction): void => {
  const { recipientUserId, eventGroup, title, message, priority, channel } = req.body;

  if (!recipientUserId) {
    res.status(400).json({ success: false, message: 'recipientUserId is required' });
    return;
  }

  if (!eventGroup || !VALID_EVENT_GROUPS.includes(eventGroup)) {
    res.status(400).json({
      success: false,
      message: `eventGroup is required and must be one of: ${VALID_EVENT_GROUPS.join(', ')}`
    });
    return;
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ success: false, message: 'Notification title is required' });
    return;
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ success: false, message: 'Notification message is required' });
    return;
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    res.status(400).json({
      success: false,
      message: `priority must be one of: ${VALID_PRIORITIES.join(', ')}`
    });
    return;
  }

  if (channel && !VALID_CHANNELS.includes(channel)) {
    res.status(400).json({
      success: false,
      message: `channel must be one of: ${VALID_CHANNELS.join(', ')}`
    });
    return;
  }

  next();
};

export const validateBroadcastNotification = (req: Request, res: Response, next: NextFunction): void => {
  const { recipients, targetRole, eventGroup, title, message } = req.body;

  if (!recipients && !targetRole) {
    res.status(400).json({
      success: false,
      message: 'Either a recipients array of user IDs or a targetRole (e.g. farmer, project_developer) is required'
    });
    return;
  }

  if (recipients && (!Array.isArray(recipients) || recipients.length === 0)) {
    res.status(400).json({
      success: false,
      message: 'recipients must be a non-empty array of user IDs'
    });
    return;
  }

  if (!eventGroup || !VALID_EVENT_GROUPS.includes(eventGroup)) {
    res.status(400).json({
      success: false,
      message: `eventGroup is required and must be one of: ${VALID_EVENT_GROUPS.join(', ')}`
    });
    return;
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ success: false, message: 'title is required' });
    return;
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ success: false, message: 'message is required' });
    return;
  }

  next();
};
