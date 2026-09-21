import mongoose, { Document, Schema } from 'mongoose';

export interface IEvidence extends Document {
  projectId: mongoose.Types.ObjectId;
  landId?: mongoose.Types.ObjectId;
  visitId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  evidenceType: 'photo' | 'video' | 'document' | 'measurement' | 'gps';
  fileUrl: string;
  fileHash?: string;
  captureLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  capturedAt: Date;
  deviceMetadata?: {
    deviceId?: string;
    model?: string;
    os?: string;
  };
  status: 'uploaded' | 'processing' | 'accepted' | 'needs_correction' | 'rejected' | 'archived';
  correctionNote?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EvidenceSchema = new Schema<IEvidence>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    landId: { type: Schema.Types.ObjectId, ref: 'Land' },
    visitId: { type: Schema.Types.ObjectId, ref: 'FieldVisit' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    evidenceType: {
      type: String,
      required: true,
      enum: ['photo', 'video', 'document', 'measurement', 'gps']
    },
    fileUrl: { type: String, required: true },
    fileHash: { type: String },
    captureLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number
    },
    capturedAt: { type: Date, default: Date.now },
    deviceMetadata: {
      deviceId: String,
      model: String,
      os: String
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'accepted', 'needs_correction', 'rejected', 'archived'],
      default: 'uploaded'
    },
    correctionNote: { type: String },
    rejectionReason: { type: String }
  },
  { timestamps: true }
);

export const Evidence = mongoose.model<IEvidence>('Evidence', EvidenceSchema);
