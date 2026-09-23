import mongoose, { Document, Schema } from 'mongoose';

export type MrvStatus =
  | 'draft'
  | 'processing'
  | 'calculated'
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'clarification_required';

export type AuditOpinion =
  | 'unqualified_pass'
  | 'qualified_pass'
  | 'fail'
  | 're_audit_required';

export interface IMrvRecord extends Document {
  mrvCode: string;
  projectId: mongoose.Types.ObjectId;
  landParcelIds: mongoose.Types.ObjectId[];
  monitoringCycleNumber: number;
  reportingPeriod: {
    startDate: Date;
    endDate: Date;
  };
  methodology: string;
  remoteSensingData?: {
    satelliteSource: string;
    meanNdvi: number;
    baselineNdvi: number;
    ndviDelta: number;
    vegetationCoverPercent?: number;
    cloudCoverPercent?: number;
    imageryDate?: Date;
  };
  quantification: {
    baselineGrossImpact: number;
    reportingGrossImpact: number;
    grossDeltaImpact: number;
    leakageDeductionPercent: number;
    uncertaintyBufferPercent: number;
    netClaimableCredits: number;
    unit: string;
  };
  evidenceIds: mongoose.Types.ObjectId[];
  fieldVisitIds: mongoose.Types.ObjectId[];
  submittedBy?: mongoose.Types.ObjectId;
  submittedAt?: Date;
  status: MrvStatus;
  verificationDetails?: {
    verifierId?: mongoose.Types.ObjectId;
    verifierOrganization?: string;
    verifiedAt?: Date;
    statementUrl?: string;
    auditOpinion?: AuditOpinion;
    notes?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MrvRecordSchema = new Schema<IMrvRecord>(
  {
    mrvCode: { type: String, required: true, unique: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    landParcelIds: [{ type: Schema.Types.ObjectId, ref: 'Land' }],
    monitoringCycleNumber: { type: Number, required: true, default: 1 },
    reportingPeriod: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true }
    },
    methodology: { type: String, required: true, trim: true },
    remoteSensingData: {
      satelliteSource: { type: String, default: 'Sentinel-2' },
      meanNdvi: { type: Number },
      baselineNdvi: { type: Number },
      ndviDelta: { type: Number },
      vegetationCoverPercent: { type: Number },
      cloudCoverPercent: { type: Number },
      imageryDate: { type: Date }
    },
    quantification: {
      baselineGrossImpact: { type: Number, required: true, default: 0 },
      reportingGrossImpact: { type: Number, required: true, default: 0 },
      grossDeltaImpact: { type: Number, required: true, default: 0 },
      leakageDeductionPercent: { type: Number, default: 5 },
      uncertaintyBufferPercent: { type: Number, default: 10 },
      netClaimableCredits: { type: Number, required: true, default: 0 },
      unit: { type: String, required: true, default: 'tCO2e' }
    },
    evidenceIds: [{ type: Schema.Types.ObjectId, ref: 'Evidence' }],
    fieldVisitIds: [{ type: Schema.Types.ObjectId, ref: 'FieldVisit' }],
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date },
    status: {
      type: String,
      enum: [
        'draft',
        'processing',
        'calculated',
        'submitted',
        'under_review',
        'verified',
        'rejected',
        'clarification_required'
      ],
      default: 'draft',
      index: true
    },
    verificationDetails: {
      verifierId: { type: Schema.Types.ObjectId, ref: 'User' },
      verifierOrganization: { type: String },
      verifiedAt: { type: Date },
      statementUrl: { type: String },
      auditOpinion: {
        type: String,
        enum: ['unqualified_pass', 'qualified_pass', 'fail', 're_audit_required']
      },
      notes: { type: String }
    },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

MrvRecordSchema.index({ projectId: 1, monitoringCycleNumber: 1 });
MrvRecordSchema.index({ status: 1 });

export const MrvRecord = mongoose.model<IMrvRecord>('MrvRecord', MrvRecordSchema);

