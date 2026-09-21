import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  recipientUserId: mongoose.Types.ObjectId;
  eventGroup: 'account' | 'land' | 'project' | 'field' | 'evidence' | 'mrv' | 'verification' | 'program' | 'benefits' | 'support';
  title: string;
  message: string;
  deepLink?: string;
  isRead: boolean;
  readAt?: Date;
  channel: 'in_app' | 'push' | 'sms';
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventGroup: {
      type: String,
      required: true,
      enum: ['account', 'land', 'project', 'field', 'evidence', 'mrv', 'verification', 'program', 'benefits', 'support']
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    deepLink: { type: String },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    channel: { type: String, enum: ['in_app', 'push', 'sms'], default: 'in_app' }
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
