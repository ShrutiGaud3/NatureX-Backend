import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: mongoose.Types.ObjectId;
  actorRole: string;
  action: string;
  resourceType: 'user' | 'kyc' | 'land' | 'project' | 'evidence' | 'mrv' | 'verification' | 'payout' | 'system';
  resourceId: string;
  oldStatus?: string;
  newStatus?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Map<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    resourceType: {
      type: String,
      required: true,
      enum: ['user', 'kyc', 'land', 'project', 'evidence', 'mrv', 'verification', 'payout', 'system']
    },
    resourceId: { type: String, required: true, index: true },
    oldStatus: { type: String },
    newStatus: { type: String },
    reason: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Map, of: Schema.Types.Mixed, default: {} }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
