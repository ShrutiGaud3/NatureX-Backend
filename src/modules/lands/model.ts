import mongoose, { Document, Schema } from 'mongoose';

export interface ILand extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  landName: string;
  surveyNumber?: string;
  ownershipType: 'owned' | 'leased' | 'community' | 'shared';
  currentCrop?: string;
  irrigationSource?: string;
  village: string;
  block?: string;
  district: string;
  state: string;
  areaInAcres?: number;
  areaInHectares?: number;
  calculatedAreaSqM?: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'clarification' | 'conflict';
  hasConflict: boolean;
  clarificationReason?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LandSchema = new Schema<ILand>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    landName: { type: String, required: true, trim: true },
    surveyNumber: { type: String },
    ownershipType: {
      type: String,
      enum: ['owned', 'leased', 'community', 'shared'],
      default: 'owned'
    },
    currentCrop: { type: String },
    irrigationSource: { type: String },
    village: { type: String, required: true },
    block: { type: String },
    district: { type: String, required: true },
    state: { type: String, required: true },
    areaInAcres: { type: Number },
    areaInHectares: { type: Number },
    calculatedAreaSqM: { type: Number },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'clarification', 'conflict'],
      default: 'draft'
    },
    hasConflict: { type: Boolean, default: false },
    clarificationReason: { type: String },
    rejectionReason: { type: String }
  },
  { timestamps: true }
);

export const Land = mongoose.model<ILand>('Land', LandSchema);
