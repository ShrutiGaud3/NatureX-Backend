import mongoose, { Document, Schema } from 'mongoose';

export interface IFieldVisit extends Document {
  projectId: mongoose.Types.ObjectId;
  landId: mongoose.Types.ObjectId;
  assignedAgentId: mongoose.Types.ObjectId;
  scheduledDate: Date;
  startedAt?: Date;
  completedAt?: Date;
  startLocation?: {
    latitude: number;
    longitude: number;
  };
  checklist: Array<{
    itemKey: string;
    label: string;
    passed: boolean;
    notes?: string;
  }>;
  measurements: Array<{
    metricKey: string;
    value: number;
    unit: string;
    method?: string;
  }>;
  notes?: string;
  idempotencyKey?: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'pending_sync';
  createdAt: Date;
  updatedAt: Date;
}

const FieldVisitSchema = new Schema<IFieldVisit>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    landId: { type: Schema.Types.ObjectId, ref: 'Land', required: true },
    assignedAgentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scheduledDate: { type: Date, required: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
    startLocation: {
      latitude: Number,
      longitude: Number
    },
    checklist: [
      {
        itemKey: String,
        label: String,
        passed: Boolean,
        notes: String
      }
    ],
    measurements: [
      {
        metricKey: String,
        value: Number,
        unit: String,
        method: String
      }
    ],
    notes: { type: String },
    idempotencyKey: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed', 'cancelled', 'pending_sync'],
      default: 'assigned'
    }
  },
  { timestamps: true }
);

export const FieldVisit = mongoose.model<IFieldVisit>('FieldVisit', FieldVisitSchema);
