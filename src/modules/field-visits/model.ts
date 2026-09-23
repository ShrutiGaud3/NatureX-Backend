import mongoose, { Document, Schema } from 'mongoose';

export type VisitType =
  | 'baseline_survey'
  | 'soil_sampling'
  | 'drone_monitoring'
  | 'practice_verification'
  | 'farmer_training'
  | 'grievance_inspection'
  | 'annual_audit';

export type VisitStatus =
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export interface IChecklistItem {
  itemKey: string;
  label: string;
  status: 'pass' | 'fail' | 'na';
  notes?: string;
  evidenceRef?: string;
}

export interface IMeasurementItem {
  metricKey: string;
  label?: string;
  value: number;
  unit: string;
  method?: string;
  depthCm?: number;
}

export interface IFieldVisit extends Document {
  visitCode: string;
  projectId: mongoose.Types.ObjectId;
  landId: mongoose.Types.ObjectId;
  assignedAgentId: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  visitType: VisitType;
  scheduledDate: Date;
  startedAt?: Date;
  completedAt?: Date;
  checkInLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    distanceToParcelMeters?: number;
  };
  checkOutLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  checklist: IChecklistItem[];
  measurements: IMeasurementItem[];
  observations?: string;
  farmerPresent?: boolean;
  farmerSignatureUrl?: string;
  farmerNotes?: string;
  evidenceIds: mongoose.Types.ObjectId[];
  notes?: string;
  cancellationReason?: string;
  idempotencyKey?: string;
  offlineSyncTimestamp?: Date;
  status: VisitStatus;
  createdAt: Date;
  updatedAt: Date;
}

const FieldVisitSchema = new Schema<IFieldVisit>(
  {
    visitCode: { type: String, required: true, unique: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    landId: { type: Schema.Types.ObjectId, ref: 'Land', required: true, index: true },
    assignedAgentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    visitType: {
      type: String,
      enum: [
        'baseline_survey',
        'soil_sampling',
        'drone_monitoring',
        'practice_verification',
        'farmer_training',
        'grievance_inspection',
        'annual_audit'
      ],
      default: 'baseline_survey',
      index: true
    },
    scheduledDate: { type: Date, required: true, index: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
    checkInLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
      distanceToParcelMeters: { type: Number }
    },
    checkOutLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number }
    },
    checklist: [
      {
        itemKey: { type: String, required: true },
        label: { type: String, required: true },
        status: { type: String, enum: ['pass', 'fail', 'na'], default: 'na' },
        notes: { type: String },
        evidenceRef: { type: String }
      }
    ],
    measurements: [
      {
        metricKey: { type: String, required: true },
        label: { type: String },
        value: { type: Number, required: true },
        unit: { type: String, required: true },
        method: { type: String },
        depthCm: { type: Number }
      }
    ],
    observations: { type: String, trim: true },
    farmerPresent: { type: Boolean, default: true },
    farmerSignatureUrl: { type: String },
    farmerNotes: { type: String, trim: true },
    evidenceIds: [{ type: Schema.Types.ObjectId, ref: 'Evidence' }],
    notes: { type: String, trim: true },
    cancellationReason: { type: String, trim: true },
    idempotencyKey: { type: String, unique: true, sparse: true },
    offlineSyncTimestamp: { type: Date },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
      default: 'assigned',
      index: true
    }
  },
  { timestamps: true }
);

FieldVisitSchema.index({ assignedAgentId: 1, status: 1, scheduledDate: 1 });
FieldVisitSchema.index({ projectId: 1, status: 1 });

export const FieldVisit = mongoose.model<IFieldVisit>('FieldVisit', FieldVisitSchema);

