import mongoose, { Document, Schema } from 'mongoose';

export interface ILandDocumentRef {
  documentType: string;
  documentUrl: string;
  uploadedAt: Date;
}

export interface ILand extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  landName: string;
  surveyNumber?: string;
  ownershipType: 'owned' | 'leased' | 'community' | 'shared';
  currentCrop?: string;
  irrigationSource?: 'canal' | 'borewell' | 'rainfed' | 'river' | 'drip' | 'other';
  soilType?: string;
  village: string;
  block?: string;
  district: string;
  state: string;
  pincode?: string;
  areaInAcres: number;
  areaInHectares: number;
  calculatedAreaSqM: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'clarification' | 'conflict';
  hasConflict: boolean;
  conflictNotes?: string;
  clarificationReason?: string;
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  documents?: ILandDocumentRef[];
  createdAt: Date;
  updatedAt: Date;
}

const LandDocumentRefSchema = new Schema<ILandDocumentRef>(
  {
    documentType: { type: String, required: true },
    documentUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const LandSchema = new Schema<ILand>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    landName: { type: String, required: true, trim: true },
    surveyNumber: { type: String, trim: true },
    ownershipType: {
      type: String,
      enum: ['owned', 'leased', 'community', 'shared'],
      default: 'owned'
    },
    currentCrop: { type: String, trim: true },
    irrigationSource: {
      type: String,
      enum: ['canal', 'borewell', 'rainfed', 'river', 'drip', 'other'],
      default: 'rainfed'
    },
    soilType: { type: String, trim: true },
    village: { type: String, required: true, trim: true },
    block: { type: String, trim: true },
    district: { type: String, required: true, trim: true, index: true },
    state: { type: String, required: true, trim: true, index: true },
    pincode: { type: String, trim: true },
    areaInAcres: { type: Number, required: true },
    areaInHectares: { type: Number, required: true },
    calculatedAreaSqM: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'clarification', 'conflict'],
      default: 'draft',
      index: true
    },
    hasConflict: { type: Boolean, default: false, index: true },
    conflictNotes: { type: String },
    clarificationReason: { type: String },
    rejectionReason: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    documents: [LandDocumentRefSchema]
  },
  { timestamps: true }
);

export const Land = mongoose.model<ILand>('Land', LandSchema);

