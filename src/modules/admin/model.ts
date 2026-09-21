import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminConfig extends Document {
  configKey: string;
  configValue: any;
  category: 'system' | 'maps' | 'storage' | 'notifications' | 'feature_flags';
  description?: string;
  isPublic: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdminConfigSchema = new Schema<IAdminConfig>(
  {
    configKey: { type: String, required: true, unique: true },
    configValue: { type: Schema.Types.Mixed, required: true },
    category: {
      type: String,
      enum: ['system', 'maps', 'storage', 'notifications', 'feature_flags'],
      default: 'system'
    },
    description: { type: String },
    isPublic: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const AdminConfig = mongoose.model<IAdminConfig>('AdminConfig', AdminConfigSchema);
