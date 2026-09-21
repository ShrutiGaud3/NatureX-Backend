import mongoose, { Document, Schema } from 'mongoose';

export interface IBenefitLedger extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  benefitType: 'carbon_incentive' | 'water_credit_share' | 'biodiversity_grant' | 'practice_incentive';
  status: 'pending' | 'approved' | 'initiated' | 'paid' | 'failed' | 'reversed';
  reconciliationReference?: string;
  paymentMethod?: string;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BenefitLedgerSchema = new Schema<IBenefitLedger>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    benefitType: {
      type: String,
      required: true,
      enum: ['carbon_incentive', 'water_credit_share', 'biodiversity_grant', 'practice_incentive']
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'initiated', 'paid', 'failed', 'reversed'],
      default: 'pending'
    },
    reconciliationReference: { type: String },
    paymentMethod: { type: String },
    paidAt: { type: Date },
    notes: { type: String }
  },
  { timestamps: true }
);

export const BenefitLedger = mongoose.model<IBenefitLedger>('BenefitLedger', BenefitLedgerSchema);
