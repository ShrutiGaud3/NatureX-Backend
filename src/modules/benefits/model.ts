import mongoose, { Document, Schema } from 'mongoose';

export type BenefitType =
  | 'carbon_incentive'
  | 'water_credit_share'
  | 'biodiversity_grant'
  | 'practice_incentive'
  | 'program_subsidy'
  | 'credit_sale_revenue';

export type BenefitStatus =
  | 'pending'
  | 'approved'
  | 'initiated'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'reversed';

export type PayoutMethod = 'bank_transfer' | 'upi' | 'direct_debit' | 'cheque';

export interface IBenefitLedger extends Document {
  transactionCode: string;
  userId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  programId?: mongoose.Types.ObjectId;
  landId?: mongoose.Types.ObjectId;
  benefitType: BenefitType;
  calculationBasis?: {
    enrolledAcreage?: number;
    ratePerAcre?: number;
    carbonCreditsAllocated?: number;
    pricePerCredit?: number;
    revenueSharePercentage?: number;
  };
  amount: number;
  deductions?: {
    platformFee?: number;
    fpoFee?: number;
    taxTds?: number;
    netAmount?: number;
  };
  currency: string;
  status: BenefitStatus;
  payoutDetails?: {
    payoutMethod?: PayoutMethod;
    bankAccountId?: mongoose.Types.ObjectId;
    bankAccountNumberMasked?: string;
    ifscCode?: string;
    upiId?: string;
    transactionReference?: string;
    reconciliationReference?: string;
    initiatedAt?: Date;
    paidAt?: Date;
    failureReason?: string;
  };
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const BenefitLedgerSchema = new Schema<IBenefitLedger>(
  {
    transactionCode: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', index: true },
    landId: { type: Schema.Types.ObjectId, ref: 'Land' },
    benefitType: {
      type: String,
      required: true,
      enum: [
        'carbon_incentive',
        'water_credit_share',
        'biodiversity_grant',
        'practice_incentive',
        'program_subsidy',
        'credit_sale_revenue'
      ],
      index: true
    },
    calculationBasis: {
      enrolledAcreage: { type: Number },
      ratePerAcre: { type: Number },
      carbonCreditsAllocated: { type: Number },
      pricePerCredit: { type: Number },
      revenueSharePercentage: { type: Number }
    },
    amount: { type: Number, required: true, min: 0 },
    deductions: {
      platformFee: { type: Number, default: 0 },
      fpoFee: { type: Number, default: 0 },
      taxTds: { type: Number, default: 0 },
      netAmount: { type: Number }
    },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'initiated', 'processing', 'paid', 'failed', 'reversed'],
      default: 'pending',
      index: true
    },
    payoutDetails: {
      payoutMethod: {
        type: String,
        enum: ['bank_transfer', 'upi', 'direct_debit', 'cheque'],
        default: 'bank_transfer'
      },
      bankAccountId: { type: Schema.Types.ObjectId, ref: 'BankProfile' },
      bankAccountNumberMasked: { type: String },
      ifscCode: { type: String },
      upiId: { type: String },
      transactionReference: { type: String },
      reconciliationReference: { type: String },
      initiatedAt: { type: Date },
      paidAt: { type: Date },
      failureReason: { type: String }
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    notes: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

BenefitLedgerSchema.index({ status: 1, benefitType: 1 });
BenefitLedgerSchema.index({ userId: 1, createdAt: -1 });
BenefitLedgerSchema.index({ projectId: 1, status: 1 });

export const BenefitLedger = mongoose.model<IBenefitLedger>('BenefitLedger', BenefitLedgerSchema);
