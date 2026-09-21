import mongoose, { Document, Schema } from 'mongoose';

export interface IBankProfile extends Document {
  userId: mongoose.Types.ObjectId;
  accountHolderName: string;
  accountNumber: string;
  maskedAccountNumber: string;
  ifscCode: string;
  bankName?: string;
  branch?: string;
  isVerified: boolean;
  status: 'draft' | 'submitted' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const BankProfileSchema = new Schema<IBankProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountHolderName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true },
    maskedAccountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true, uppercase: true, trim: true },
    bankName: { type: String },
    branch: { type: String },
    isVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'verified', 'rejected'],
      default: 'draft'
    }
  },
  { timestamps: true }
);

export const BankProfile = mongoose.model<IBankProfile>('BankProfile', BankProfileSchema);
