import mongoose, { Document, Schema } from 'mongoose';

export type TaskType =
  | 'land_survey'
  | 'farmer_onboarding'
  | 'soil_collection'
  | 'tree_enumeration'
  | 'photo_evidence'
  | 'grievance_resolution'
  | 'mrv_audit_sample'
  | 'document_collection'
  | 'general';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus =
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'verified'
  | 'rejected'
  | 'reopened'
  | 'cancelled';

export interface IFieldTask extends Document {
  taskCode: string;
  title: string;
  description?: string;
  taskType: TaskType;
  projectId: mongoose.Types.ObjectId;
  landId?: mongoose.Types.ObjectId;
  visitId?: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  assignedBy?: mongoose.Types.ObjectId;
  priority: TaskPriority;
  dueDate: Date;
  startedAt?: Date;
  completedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  status: TaskStatus;
  completionNotes?: string;
  submissionData?: Record<string, any>;
  evidenceIds: mongoose.Types.ObjectId[];
  targetLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  reviewNotes?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FieldTaskSchema = new Schema<IFieldTask>(
  {
    taskCode: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    taskType: {
      type: String,
      enum: [
        'land_survey',
        'farmer_onboarding',
        'soil_collection',
        'tree_enumeration',
        'photo_evidence',
        'grievance_resolution',
        'mrv_audit_sample',
        'document_collection',
        'general'
      ],
      default: 'general',
      index: true
    },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    landId: { type: Schema.Types.ObjectId, ref: 'Land', index: true },
    visitId: { type: Schema.Types.ObjectId, ref: 'FieldVisit', index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true
    },
    dueDate: { type: Date, required: true, index: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'submitted', 'verified', 'rejected', 'reopened', 'cancelled'],
      default: 'assigned',
      index: true
    },
    completionNotes: { type: String, trim: true },
    submissionData: { type: Schema.Types.Mixed },
    evidenceIds: [{ type: Schema.Types.ObjectId, ref: 'Evidence' }],
    targetLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String }
    },
    reviewNotes: { type: String, trim: true },
    rejectionReason: { type: String, trim: true }
  },
  { timestamps: true }
);

FieldTaskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });
FieldTaskSchema.index({ projectId: 1, status: 1 });

export const FieldTask = mongoose.model<IFieldTask>('FieldTask', FieldTaskSchema);

