import mongoose, { Document, Schema } from 'mongoose';

export type ProgramType =
  | 'carbon_incentive'
  | 'water_replenishment'
  | 'regenerative_agriculture'
  | 'agroforestry_subsidy'
  | 'biodiversity_restoration';

export type ProgramStatus = 'draft' | 'active' | 'paused' | 'closed' | 'completed';

export type EnrollmentStatus =
  | 'applied'
  | 'verified'
  | 'active'
  | 'completed'
  | 'rejected'
  | 'withdrawn';

export interface IProgramEnrollment {
  enrollmentCode: string;
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  landId: mongoose.Types.ObjectId;
  enrolledAcreage: number;
  status: EnrollmentStatus;
  appliedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  totalPayoutEarned?: number;
}

export interface IProgram extends Document {
  programCode: string;
  name: string;
  sponsorName: string;
  description?: string;
  programType: ProgramType;
  financials: {
    budgetTotal: number;
    disbursedAmount: number;
    incentivePerAcre: number;
    incentivePerCredit?: number;
    currency: string;
  };
  eligibilityCriteria: {
    minAcreage: number;
    maxAcreage: number;
    allowedStates: string[];
    eligibleProjectTypes: string[];
    requiredPractices?: string[];
  };
  targets: {
    targetFarmers: number;
    enrolledFarmersCount: number;
    targetAcreage: number;
    enrolledAcreage: number;
  };
  timeline: {
    startDate: Date;
    endDate: Date;
    enrollmentDeadline?: Date;
  };
  status: ProgramStatus;
  enrollments: IProgramEnrollment[];
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramSchema = new Schema<IProgram>(
  {
    programCode: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    sponsorName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    programType: {
      type: String,
      enum: [
        'carbon_incentive',
        'water_replenishment',
        'regenerative_agriculture',
        'agroforestry_subsidy',
        'biodiversity_restoration'
      ],
      default: 'carbon_incentive',
      index: true
    },
    financials: {
      budgetTotal: { type: Number, required: true, default: 0 },
      disbursedAmount: { type: Number, default: 0 },
      incentivePerAcre: { type: Number, required: true, default: 0 },
      incentivePerCredit: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' }
    },
    eligibilityCriteria: {
      minAcreage: { type: Number, default: 0.5 },
      maxAcreage: { type: Number, default: 100.0 },
      allowedStates: [{ type: String, trim: true }],
      eligibleProjectTypes: [{ type: String, trim: true }],
      requiredPractices: [{ type: String, trim: true }]
    },
    targets: {
      targetFarmers: { type: Number, default: 100 },
      enrolledFarmersCount: { type: Number, default: 0 },
      targetAcreage: { type: Number, default: 500 },
      enrolledAcreage: { type: Number, default: 0 }
    },
    timeline: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      enrollmentDeadline: { type: Date }
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'closed', 'completed'],
      default: 'active',
      index: true
    },
    enrollments: [
      {
        enrollmentCode: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
        landId: { type: Schema.Types.ObjectId, ref: 'Land', required: true },
        enrolledAcreage: { type: Number, required: true },
        status: {
          type: String,
          enum: ['applied', 'verified', 'active', 'completed', 'rejected', 'withdrawn'],
          default: 'applied'
        },
        appliedAt: { type: Date, default: Date.now },
        verifiedAt: { type: Date },
        verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        rejectionReason: { type: String },
        totalPayoutEarned: { type: Number, default: 0 }
      }
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

ProgramSchema.index({ status: 1, programType: 1 });
ProgramSchema.index({ 'enrollments.userId': 1 });

export const Program = mongoose.model<IProgram>('Program', ProgramSchema);

