import mongoose, { Document, Schema } from 'mongoose';

export type VerificationStatus =
  | 'initiated'
  | 'desk_review'
  | 'site_audit'
  | 'findings_issued'
  | 'report_submitted'
  | 'approved'
  | 'rejected'
  | 'certified';

export type VerificationStandard =
  | 'verra_vcs'
  | 'gold_standard'
  | 'art_trees'
  | 'naturex_internal'
  | 'iso_14064';

export type AuditType = 'desk_review' | 'field_visit' | 'hybrid' | 'periodic_issuance';

export interface IVerificationCase extends Document {
  verificationCode: string;
  projectId: mongoose.Types.ObjectId;
  assignedAgencyName: string;
  acvaRegistrationNumber?: string;
  leadAuditorName?: string;
  verifierUserId?: mongoose.Types.ObjectId;
  verificationStandard: VerificationStandard;
  auditType: AuditType;
  vintageYear: number;
  monitoringPeriod?: {
    startDate?: Date;
    endDate?: Date;
  };
  quantification?: {
    claimedCredits?: number;
    verifiedCredits?: number;
    bufferDeductions?: number;
    netIssuanceCredits?: number;
  };
  status: VerificationStatus;
  auditReportUrl?: string;
  certificateUrl?: string;
  certificateNumber?: string;
  externalRegistryReference?: string;
  auditFindingsSummary?: string;
  decisionNotes?: string;
  decisionDate?: Date;
  decisionBy?: mongoose.Types.ObjectId;
  isLocked: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationCaseSchema = new Schema<IVerificationCase>(
  {
    verificationCode: { type: String, required: true, unique: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    assignedAgencyName: { type: String, required: true, trim: true },
    acvaRegistrationNumber: { type: String, trim: true },
    leadAuditorName: { type: String, trim: true },
    verifierUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    verificationStandard: {
      type: String,
      enum: ['verra_vcs', 'gold_standard', 'art_trees', 'naturex_internal', 'iso_14064'],
      default: 'naturex_internal',
      index: true
    },
    auditType: {
      type: String,
      enum: ['desk_review', 'field_visit', 'hybrid', 'periodic_issuance'],
      default: 'hybrid'
    },
    vintageYear: { type: Number, default: () => new Date().getFullYear() },
    monitoringPeriod: {
      startDate: { type: Date },
      endDate: { type: Date }
    },
    quantification: {
      claimedCredits: { type: Number, default: 0 },
      verifiedCredits: { type: Number, default: 0 },
      bufferDeductions: { type: Number, default: 0 },
      netIssuanceCredits: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: [
        'initiated',
        'desk_review',
        'site_audit',
        'findings_issued',
        'report_submitted',
        'approved',
        'rejected',
        'certified'
      ],
      default: 'initiated',
      index: true
    },
    auditReportUrl: { type: String, trim: true },
    certificateUrl: { type: String, trim: true },
    certificateNumber: { type: String, trim: true },
    externalRegistryReference: { type: String, trim: true },
    auditFindingsSummary: { type: String },
    decisionNotes: { type: String },
    decisionDate: { type: Date },
    decisionBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isLocked: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

VerificationCaseSchema.index({ status: 1, vintageYear: 1 });
VerificationCaseSchema.index({ projectId: 1, createdAt: -1 });

export const VerificationCase = mongoose.model<IVerificationCase>(
  'VerificationCase',
  VerificationCaseSchema
);
