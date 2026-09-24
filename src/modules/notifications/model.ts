import mongoose, { Document, Schema } from 'mongoose';

export type EventGroup =
  | 'account'
  | 'land'
  | 'project'
  | 'field'
  | 'evidence'
  | 'mrv'
  | 'verification'
  | 'program'
  | 'benefits'
  | 'support'
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationChannel = 'in_app' | 'push' | 'sms' | 'email' | 'all';

export interface INotification extends Document {
  recipientUserId: mongoose.Types.ObjectId;
  senderUserId?: mongoose.Types.ObjectId;
  eventGroup: EventGroup;
  eventType?: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  channel: NotificationChannel;
  deepLink?: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  isArchived: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    eventGroup: {
      type: String,
      required: true,
      enum: [
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
      ],
      index: true
    },
    eventType: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true
    },
    channel: {
      type: String,
      enum: ['in_app', 'push', 'sms', 'email', 'all'],
      default: 'in_app'
    },
    deepLink: { type: String, trim: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    isArchived: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipientUserId: 1, isArchived: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
