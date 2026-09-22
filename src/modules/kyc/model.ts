import mongoose, { Document, Schema } from 'mongoose';

export interface IKYCHistory {
  status: string;
  changedBy?: mongoose.Types.ObjectId;
  note?: string;
  changedAt: Date;
}

export interface IKYC extends Document {
  userId: mongoose.Types.ObjectId;
  documentType: 'aadhaar' | 'pan' | 'voter_id' | 'driving_license' | 'passport';
  documentNumber: string;
  nameOnDocument?: string;
  dobOnDocument?: string;
  frontImageUrl: string;
  backImageUrl?: string;
  selfieUrl?: string;
  consentAgreed: boolean;
  consentTimestamp: Date;
  consentText?: string;
  status: 'draft' | 'submitted' | 'approved' | 'clarification' | 'rejected' | 'suspended';
  clarificationQuestion?: string;
  clarificationReply?: string;
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  history: IKYCHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const KYCHistorySchema = new Schema<IKYCHistory>(
  {
    status: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    note: { type: String },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const KYCSchema = new Schema<IKYC>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    documentType: {
      type: String,
      required: true,
      enum: ['aadhaar', 'pan', 'voter_id', 'driving_license', 'passport']
    },
    documentNumber: { type: String, required: true, trim: true },
    nameOnDocument: { type: String, trim: true },
    dobOnDocument: { type: String, trim: true },
    frontImageUrl: { type: String, required: true },
    backImageUrl: { type: String },
    selfieUrl: { type: String },
    consentAgreed: { type: Boolean, required: true, default: false },
    consentTimestamp: { type: Date, default: Date.now },
    consentText: {
      type: String,
      default: 'I hereby grant explicit consent to NatureX platform to verify and process my identity document for KYC and verification purposes.'
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'clarification', 'rejected', 'suspended'],
      default: 'draft',
      index: true
    },
    clarificationQuestion: { type: String },
    clarificationReply: { type: String },
    rejectionReason: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    history: [KYCHistorySchema]
  },
  { timestamps: true }
);

export const KYC = mongoose.model<IKYC>('KYC', KYCSchema);

