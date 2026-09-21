import mongoose, { Document, Schema } from 'mongoose';

export interface IKYC extends Document {
  userId: mongoose.Types.ObjectId;
  documentType: 'aadhaar' | 'pan' | 'voter_id' | 'driving_license';
  documentNumber: string;
  frontImageUrl: string;
  backImageUrl?: string;
  consentAgreed: boolean;
  consentTimestamp: Date;
  status: 'draft' | 'submitted' | 'approved' | 'clarification' | 'rejected' | 'suspended';
  clarificationQuestion?: string;
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const KYCSchema = new Schema<IKYC>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentType: {
      type: String,
      required: true,
      enum: ['aadhaar', 'pan', 'voter_id', 'driving_license']
    },
    documentNumber: { type: String, required: true },
    frontImageUrl: { type: String, required: true },
    backImageUrl: { type: String },
    consentAgreed: { type: Boolean, required: true, default: false },
    consentTimestamp: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'clarification', 'rejected', 'suspended'],
      default: 'draft'
    },
    clarificationQuestion: { type: String },
    rejectionReason: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

export const KYC = mongoose.model<IKYC>('KYC', KYCSchema);
