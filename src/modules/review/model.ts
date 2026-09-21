import mongoose, { Document, Schema } from 'mongoose';

export interface IReviewFinding extends Document {
  projectId: mongoose.Types.ObjectId;
  entityType: 'project' | 'land' | 'kyc' | 'evidence' | 'mrv';
  entityId: mongoose.Types.ObjectId;
  raisedBy: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'open' | 'responded' | 'evidence_added' | 'resolved' | 'reopened' | 'closed';
  responseNotes?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewFindingSchema = new Schema<IReviewFinding>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    entityType: {
      type: String,
      required: true,
      enum: ['project', 'land', 'kyc', 'evidence', 'mrv']
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'responded', 'evidence_added', 'resolved', 'reopened', 'closed'],
      default: 'open'
    },
    responseNotes: { type: String },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

export const ReviewFinding = mongoose.model<IReviewFinding>('ReviewFinding', ReviewFindingSchema);
