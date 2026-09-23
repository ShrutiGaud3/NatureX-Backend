import mongoose, { Document, Schema } from 'mongoose';

export type ProjectType = 'carbon' | 'water' | 'biodiversity' | 'agroforestry' | 'regenerative_ag';
export type ProjectStandard = 'verra_vcs' | 'gold_standard' | 'art_trees' | 'naturex_internal' | 'other';
export type ProjectStatus =
  | 'draft'
  | 'submitted'
  | 'screening'
  | 'accepted_for_data_collection'
  | 'mrv'
  | 'technical_review'
  | 'verification'
  | 'approved'
  | 'active'
  | 'completed'
  | 'rejected'
  | 'clarification'
  | 'suspended';

export interface IProjectHistory {
  status: ProjectStatus;
  changedBy?: mongoose.Types.ObjectId;
  note?: string;
  changedAt: Date;
}

export interface IImpactMetrics {
  estimated: number;
  measured: number;
  reviewed: number;
  verified: number;
  unit: string;
  status: 'estimated' | 'measured' | 'reviewed' | 'verified';
  lastUpdatedAt?: Date;
}

export interface IProject extends Document {
  code: string;
  name: string;
  description?: string;
  projectType: ProjectType;
  standard: ProjectStandard;
  methodology?: string;
  landId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  creditingPeriodYears: number;
  status: ProjectStatus;
  clarificationReason?: string;
  rejectionReason?: string;
  assignedReviewerId?: mongoose.Types.ObjectId;
  assignedAuditorId?: mongoose.Types.ObjectId;
  impactMetrics: IImpactMetrics;
  history: IProjectHistory[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectHistorySchema = new Schema<IProjectHistory>(
  {
    status: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    note: { type: String },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ImpactMetricsSchema = new Schema<IImpactMetrics>(
  {
    estimated: { type: Number, default: 0 },
    measured: { type: Number, default: 0 },
    reviewed: { type: Number, default: 0 },
    verified: { type: Number, default: 0 },
    unit: { type: String, default: 'tCO2e' },
    status: {
      type: String,
      enum: ['estimated', 'measured', 'reviewed', 'verified'],
      default: 'estimated'
    },
    lastUpdatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProject>(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    projectType: {
      type: String,
      required: true,
      enum: ['carbon', 'water', 'biodiversity', 'agroforestry', 'regenerative_ag'],
      index: true
    },
    standard: {
      type: String,
      enum: ['verra_vcs', 'gold_standard', 'art_trees', 'naturex_internal', 'other'],
      default: 'naturex_internal'
    },
    methodology: { type: String, trim: true },
    landId: { type: Schema.Types.ObjectId, ref: 'Land', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    startDate: { type: Date },
    endDate: { type: Date },
    creditingPeriodYears: { type: Number, default: 20 },
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
        'active',
        'completed',
        'rejected',
        'clarification',
        'suspended'
      ],
      default: 'draft',
      index: true
    },
    clarificationReason: { type: String },
    rejectionReason: { type: String },
    assignedReviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedAuditorId: { type: Schema.Types.ObjectId, ref: 'User' },
    impactMetrics: { type: ImpactMetricsSchema, default: () => ({}) },
    history: [ProjectHistorySchema],
    tags: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

export const Project = mongoose.model<IProject>('Project', ProjectSchema);

