import mongoose, { Document, Schema } from 'mongoose';

export interface ILandDocument extends Document {
  landId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  documentType: 'land_record' | '7_12_extract' | 'lease_agreement' | 'consent_letter' | 'patta' | 'other';
  documentTitle: string;
  documentNumber?: string;
  fileUrl: string;
  fileHash?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LandDocumentSchema = new Schema<ILandDocument>(
  {
    landId: { type: Schema.Types.ObjectId, ref: 'Land', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    documentType: {
      type: String,
      required: true,
      enum: ['land_record', '7_12_extract', 'lease_agreement', 'consent_letter', 'patta', 'other']
    },
    documentTitle: { type: String, required: true },
    documentNumber: { type: String },
    fileUrl: { type: String, required: true },
    fileHash: { type: String },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    rejectionReason: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const LandDocument = mongoose.model<ILandDocument>('LandDocument', LandDocumentSchema);
