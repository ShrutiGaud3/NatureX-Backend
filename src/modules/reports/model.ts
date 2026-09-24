import mongoose, { Document, Schema } from 'mongoose';

export type ReportType =
  | 'executive_summary'
  | 'project_funnel'
  | 'land_registry'
  | 'financial_payout'
  | 'field_ops'
  | 'carbon_impact'
  | 'mrv_audit';

export type ReportFormat = 'json' | 'csv' | 'pdf';
export type ReportStatus = 'generating' | 'ready' | 'failed';

export interface IReportSnapshot extends Document {
  reportCode: string;
  title: string;
  reportType: ReportType;
  format: ReportFormat;
  periodStart?: Date;
  periodEnd?: Date;
  filters?: Record<string, any>;
  summaryMetrics?: Record<string, any>;
  detailedData?: any[];
  fileUrl?: string;
  status: ReportStatus;
  generatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSnapshotSchema = new Schema<IReportSnapshot>(
  {
    reportCode: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    reportType: {
      type: String,
      required: true,
      enum: [
        'executive_summary',
        'project_funnel',
        'land_registry',
        'financial_payout',
        'field_ops',
        'carbon_impact',
        'mrv_audit'
      ],
      index: true
    },
    format: {
      type: String,
      enum: ['json', 'csv', 'pdf'],
      default: 'json'
    },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    filters: { type: Schema.Types.Mixed },
    summaryMetrics: { type: Schema.Types.Mixed },
    detailedData: { type: Schema.Types.Mixed },
    fileUrl: { type: String },
    status: {
      type: String,
      enum: ['generating', 'ready', 'failed'],
      default: 'ready',
      index: true
    },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
  },
  { timestamps: true }
);

ReportSnapshotSchema.index({ reportType: 1, createdAt: -1 });

export const ReportSnapshot = mongoose.model<IReportSnapshot>(
  'ReportSnapshot',
  ReportSnapshotSchema
);
