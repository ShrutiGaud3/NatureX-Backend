import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  projectType: 'carbon' | 'water' | 'biodiversity';
  landId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  startDate?: Date;
  status:
    | 'draft'
    | 'submitted'
    | 'screening'
    | 'accepted_for_data_collection'
    | 'mrv'
    | 'technical_review'
    | 'verification'
    | 'approved'
    | 'completed'
    | 'rejected'
    | 'clarification';
  clarificationReason?: string;
  rejectionReason?: string;
  assignedReviewerId?: mongoose.Types.ObjectId;
  impactMetrics: {
    estimated?: number;
    measured?: number;
    verified?: number;
    unit?: string;
    status: 'estimated' | 'measured' | 'reviewed' | 'verified';
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    projectType: {
      type: String,
      required: true,
      enum: ['carbon', 'water', 'biodiversity']
    },
    landId: { type: Schema.Types.ObjectId, ref: 'Land', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    startDate: { type: Date },
    status: {
      type: String,
      enum: [
        'draft',
        'submitted',
        'screening',
        'accepted_for_data_collection',
        'mrv',
        'technical_review',
        'verification',
        'approved',
        'completed',
        'rejected',
        'clarification'
      ],
      default: 'draft'
    },
    clarificationReason: { type: String },
    rejectionReason: { type: String },
    assignedReviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
    impactMetrics: {
      estimated: { type: Number, default: 0 },
      measured: { type: Number, default: 0 },
      verified: { type: Number, default: 0 },
      unit: { type: String, default: 'tCO2e' },
      status: {
        type: String,
        enum: ['estimated', 'measured', 'reviewed', 'verified'],
        default: 'estimated'
      }
    }
  },
  { timestamps: true }
);

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
