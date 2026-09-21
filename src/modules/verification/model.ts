import mongoose, { Document, Schema } from 'mongoose';

export interface IVerificationCase extends Document {
  projectId: mongoose.Types.ObjectId;
  assignedAgencyName: string;
  acvaRegistrationNumber?: string;
  verifierUserId?: mongoose.Types.ObjectId;
  status: 'initiated' | 'site_audit' | 'report_submitted' | 'approved' | 'rejected';
  auditReportUrl?: string;
  externalRegistryReference?: string;
  decisionNotes?: string;
  decisionDate?: Date;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationCaseSchema = new Schema<IVerificationCase>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    assignedAgencyName: { type: String, required: true },
    acvaRegistrationNumber: { type: String },
    verifierUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['initiated', 'site_audit', 'report_submitted', 'approved', 'rejected'],
      default: 'initiated'
    },
    auditReportUrl: { type: String },
    externalRegistryReference: { type: String },
    decisionNotes: { type: String },
    decisionDate: { type: Date },
    isLocked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const VerificationCase = mongoose.model<IVerificationCase>('VerificationCase', VerificationCaseSchema);
