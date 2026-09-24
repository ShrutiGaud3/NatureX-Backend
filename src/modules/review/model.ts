import mongoose, { Document, Schema } from 'mongoose';

export type ReviewEntityType =
  | 'project'
  | 'land'
  | 'kyc'
  | 'evidence'
  | 'mrv'
  | 'questionnaire'
  | 'field_visit';

export type FindingSeverity = 'minor' | 'major' | 'critical';

export type FindingStatus =
  | 'open'
  | 'under_clarification'
  | 'evidence_submitted'
  | 'resolved'
  | 'reopened'
  | 'closed';

export type FindingCategory =
  | 'eligibility_gap'
  | 'methodology_non_compliance'
  | 'spatial_overlap'
  | 'data_inconsistency'
  | 'missing_evidence'
  | 'calculation_error'
  | 'general';

export interface IReviewResponse {
  respondedBy: mongoose.Types.ObjectId;
  message: string;
  evidenceIds?: mongoose.Types.ObjectId[];
  createdAt: Date;
}

export interface IReviewFinding extends Document {
  findingCode: string;
  projectId: mongoose.Types.ObjectId;
  entityType: ReviewEntityType;
  entityId: mongoose.Types.ObjectId;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  raisedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  status: FindingStatus;
  responses: IReviewResponse[];
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolutionSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewFindingSchema = new Schema<IReviewFinding>(
  {
    findingCode: { type: String, required: true, unique: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    entityType: {
      type: String,
      required: true,
      enum: ['project', 'land', 'kyc', 'evidence', 'mrv', 'questionnaire', 'field_visit'],
      index: true
    },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    category: {
      type: String,
      enum: [
        'eligibility_gap',
        'methodology_non_compliance',
        'spatial_overlap',
        'data_inconsistency',
        'missing_evidence',
        'calculation_error',
        'general'
      ],
      default: 'general',
      index: true
    },
    severity: {
      type: String,
      enum: ['minor', 'major', 'critical'],
      default: 'major',
      index: true
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['open', 'under_clarification', 'evidence_submitted', 'resolved', 'reopened', 'closed'],
      default: 'open',
      index: true
    },
    responses: [
      {
        respondedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, required: true, trim: true },
        evidenceIds: [{ type: Schema.Types.ObjectId, ref: 'Evidence' }],
        createdAt: { type: Date, default: Date.now }
      }
    ],
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolutionSummary: { type: String, trim: true }
  },
  { timestamps: true }
);

ReviewFindingSchema.index({ projectId: 1, status: 1, severity: 1 });

export const ReviewFinding = mongoose.model<IReviewFinding>('ReviewFinding', ReviewFindingSchema);

