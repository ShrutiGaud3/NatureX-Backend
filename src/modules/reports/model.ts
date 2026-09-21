import mongoose, { Document, Schema } from 'mongoose';

export interface IReportSnapshot extends Document {
  reportType: 'executive_summary' | 'project_funnel' | 'land_registry' | 'financial_payout' | 'field_ops';
  periodStart?: Date;
  periodEnd?: Date;
  summaryData: Map<string, any>;
  generatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSnapshotSchema = new Schema<IReportSnapshot>(
  {
    reportType: {
      type: String,
      required: true,
      enum: ['executive_summary', 'project_funnel', 'land_registry', 'financial_payout', 'field_ops']
    },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    summaryData: { type: Map, of: Schema.Types.Mixed, default: {} },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export const ReportSnapshot = mongoose.model<IReportSnapshot>('ReportSnapshot', ReportSnapshotSchema);
