import mongoose, { Document, Schema } from 'mongoose';

export interface IBankProfile extends Document {
  userId: mongoose.Types.ObjectId;
  accountHolderName: string;
  accountNumber: string;
  maskedAccountNumber: string;
  ifscCode: string;
  bankName?: string;
  branchName?: string;
  accountType: 'savings' | 'current';
  upiId?: string;
  passbookOrChequeUrl?: string;
  isVerified: boolean;
  status: 'draft' | 'submitted' | 'verified' | 'rejected';
  rejectionReason?: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BankProfileSchema = new Schema<IBankProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    accountHolderName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true },
    maskedAccountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true, uppercase: true, trim: true },
    bankName: { type: String, trim: true },
    branchName: { type: String, trim: true },
    accountType: { type: String, enum: ['savings', 'current'], default: 'savings' },
    upiId: { type: String, trim: true },
    passbookOrChequeUrl: { type: String },
    isVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'verified', 'rejected'],
      default: 'submitted',
      index: true
    },
    rejectionReason: { type: String },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

export const BankProfile = mongoose.model<IBankProfile>('BankProfile', BankProfileSchema);

