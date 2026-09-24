import mongoose, { Document, Schema } from 'mongoose';

export type ConfigCategory =
  | 'system'
  | 'feature_flags'
  | 'payout_rules'
  | 'mrv_parameters'
  | 'maps_gis'
  | 'notifications'
  | 'storage_s3'
  | 'compliance';

export interface IAdminConfig extends Document {
  configKey: string;
  configValue: any;
  category: ConfigCategory;
  description?: string;
  isPublic: boolean;
  isEncrypted: boolean;
  tags?: string[];
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdminConfigSchema = new Schema<IAdminConfig>(
  {
    configKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    configValue: { type: Schema.Types.Mixed, required: true },
    category: {
      type: String,
      enum: [
        'system',
        'feature_flags',
        'payout_rules',
        'mrv_parameters',
        'maps_gis',
        'notifications',
        'storage_s3',
        'compliance'
      ],
      default: 'system',
      index: true
    },
    description: { type: String, trim: true },
    isPublic: { type: Boolean, default: false, index: true },
    isEncrypted: { type: Boolean, default: false },
    tags: [{ type: String, trim: true }],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

AdminConfigSchema.index({ category: 1, isPublic: 1 });

export const AdminConfig = mongoose.model<IAdminConfig>('AdminConfig', AdminConfigSchema);
