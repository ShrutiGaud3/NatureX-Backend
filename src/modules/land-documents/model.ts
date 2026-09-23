import mongoose, { Document, Schema } from 'mongoose';

export type LandDocType =
  | 'land_record'
  | '7_12_extract'
  | 'khasra_khatauni'
  | 'lease_agreement'
  | 'consent_letter'
  | 'patta'
  | 'mutation_register'
  | 'noc_panchayat'
  | 'other';

export interface ILandDocument extends Document {
  landId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  documentType: LandDocType;
  documentTitle: string;
  documentNumber?: string;
  fileUrl: string;
  fileHash?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  issuingAuthority?: string;
  issueDate?: Date;
  expiryDate?: Date;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'clarification';
  rejectionReason?: string;
  clarificationQuestion?: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LandDocumentSchema = new Schema<ILandDocument>(
  {
    landId: { type: Schema.Types.ObjectId, ref: 'Land', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    documentType: {
      type: String,
      required: true,
      enum: [
        'land_record',
        '7_12_extract',
        'khasra_khatauni',
        'lease_agreement',
        'consent_letter',
        'patta',
        'mutation_register',
        'noc_panchayat',
        'other'
      ],
      index: true
    },
    documentTitle: { type: String, required: true, trim: true },
    documentNumber: { type: String, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    fileHash: { type: String, trim: true },
    fileSizeBytes: { type: Number },
    mimeType: { type: String, trim: true },
    issuingAuthority: { type: String, trim: true },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'clarification'],
      default: 'pending',
      index: true
    },
    rejectionReason: { type: String },
    clarificationQuestion: { type: String },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    uploadedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const LandDocument = mongoose.model<ILandDocument>('LandDocument', LandDocumentSchema);

