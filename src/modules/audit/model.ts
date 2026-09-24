import mongoose, { Document, Schema } from 'mongoose';

export type AuditResourceType =
  | 'user'
  | 'kyc'
  | 'land'
  | 'project'
  | 'evidence'
  | 'mrv'
  | 'verification'
  | 'payout'
  | 'program'
  | 'benefit'
  | 'support'
  | 'system';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface IAuditLog extends Document {
  logCode: string;
  actorId: mongoose.Types.ObjectId;
  actorRole: string;
  action: string;
  resourceType: AuditResourceType;
  resourceId: string;
  resourceCode?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  oldStatus?: string;
  newStatus?: string;
  reason?: string;
  severity: AuditSeverity;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    logCode: { type: String, required: true, unique: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, trim: true, index: true },
    resourceType: {
      type: String,
      required: true,
      enum: [
        'user',
        'kyc',
        'land',
        'project',
        'evidence',
        'mrv',
        'verification',
        'payout',
        'program',
        'benefit',
        'support',
        'system'
      ],
      index: true
    },
    resourceId: { type: String, required: true, index: true },
    resourceCode: { type: String, trim: true },
    oldValues: { type: Schema.Types.Mixed },
    newValues: { type: Schema.Types.Mixed },
    oldStatus: { type: String },
    newStatus: { type: String },
    reason: { type: String },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
      index: true
    },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
AuditLogSchema.index({ severity: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
