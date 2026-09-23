import mongoose, { Document, Schema } from 'mongoose';

export type EvidenceType =
  | 'photo'
  | 'video'
  | 'document'
  | 'measurement'
  | 'gps'
  | 'drone_orthomosaic'
  | 'lab_report';

export type EvidenceCategory =
  | 'baseline_soil_test'
  | 'periodic_soil_test'
  | 'tree_biomass_photo'
  | 'drone_canopy_survey'
  | 'water_flow_meter'
  | 'farmer_consent_signature'
  | 'land_boundary_audit'
  | 'general';

export type EvidenceStatus =
  | 'uploaded'
  | 'under_review'
  | 'verified'
  | 'flagged'
  | 'rejected'
  | 'archived';

export interface IEvidence extends Document {
  projectId: mongoose.Types.ObjectId;
  landId?: mongoose.Types.ObjectId;
  visitId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  evidenceType: EvidenceType;
  category: EvidenceCategory;
  title: string;
  description?: string;
  fileUrl: string;
  fileHash?: string;
  fileSize?: number;
  mimeType?: string;
  captureLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
  };
  location?: {
    type: string;
    coordinates: number[]; // [lng, lat]
  };
  capturedAt: Date;
  deviceMetadata?: {
    deviceId?: string;
    model?: string;
    os?: string;
    appVersion?: string;
  };
  metadata?: Record<string, any>;
  tags?: string[];
  status: EvidenceStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EvidenceSchema = new Schema<IEvidence>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    landId: { type: Schema.Types.ObjectId, ref: 'Land', index: true },
    visitId: { type: Schema.Types.ObjectId, ref: 'FieldVisit', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    evidenceType: {
      type: String,
      required: true,
      enum: ['photo', 'video', 'document', 'measurement', 'gps', 'drone_orthomosaic', 'lab_report'],
      index: true
    },
    category: {
      type: String,
      enum: [
        'baseline_soil_test',
        'periodic_soil_test',
        'tree_biomass_photo',
        'drone_canopy_survey',
        'water_flow_meter',
        'farmer_consent_signature',
        'land_boundary_audit',
        'general'
      ],
      default: 'general',
      index: true
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    fileHash: { type: String, trim: true },
    fileSize: { type: Number },
    mimeType: { type: String, trim: true },
    captureLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
      altitude: { type: Number }
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: undefined
      }
    },
    capturedAt: { type: Date, default: Date.now },
    deviceMetadata: {
      deviceId: { type: String },
      model: { type: String },
      os: { type: String },
      appVersion: { type: String }
    },
    metadata: { type: Schema.Types.Mixed },
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['uploaded', 'under_review', 'verified', 'flagged', 'rejected', 'archived'],
      default: 'uploaded',
      index: true
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, trim: true },
    rejectionReason: { type: String, trim: true }
  },
  { timestamps: true }
);

// Indexes
EvidenceSchema.index({ location: '2dsphere' }, { sparse: true });
EvidenceSchema.index({ projectId: 1, category: 1, status: 1 });
EvidenceSchema.index({ createdAt: -1 });

export const Evidence = mongoose.model<IEvidence>('Evidence', EvidenceSchema);

