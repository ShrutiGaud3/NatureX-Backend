import mongoose, { Document, Schema } from 'mongoose';

export interface IMrvRecord extends Document {
  projectId: mongoose.Types.ObjectId;
  monitoringCycleNumber: number;
  baselineValue: number;
  measuredValue: number;
  impactDelta: number;
  methodologyUsed?: string;
  evidenceCount: number;
  status: 'draft' | 'submitted' | 'under_review' | 'pass' | 'clarification_required';
  reviewerNotes?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MrvRecordSchema = new Schema<IMrvRecord>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    monitoringCycleNumber: { type: Number, required: true, default: 1 },
    baselineValue: { type: Number, required: true },
    measuredValue: { type: Number, required: true },
    impactDelta: { type: Number, required: true },
    methodologyUsed: { type: String },
    evidenceCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'pass', 'clarification_required'],
      default: 'draft'
    },
    reviewerNotes: { type: String },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

export const MrvRecord = mongoose.model<IMrvRecord>('MrvRecord', MrvRecordSchema);
