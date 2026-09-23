import mongoose, { Document, Schema } from 'mongoose';

export type ProjectCategory = 'climate' | 'water' | 'nature' | 'agriculture' | 'forestry';

export interface IProjectType extends Document {
  key: string;
  name: string;
  category: ProjectCategory;
  description?: string;
  defaultStandard: string;
  eligibleMethodologies: string[];
  allowedPractices: string[];
  requiredEvidenceTypes: string[];
  impactUnit: string;
  defaultCreditingPeriodYears: number;
  iconUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectTypeSchema = new Schema<IProjectType>(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['climate', 'water', 'nature', 'agriculture', 'forestry'],
      default: 'climate',
      index: true
    },
    description: { type: String, trim: true },
    defaultStandard: { type: String, default: 'naturex_internal' },
    eligibleMethodologies: [{ type: String, trim: true }],
    allowedPractices: [{ type: String, trim: true }],
    requiredEvidenceTypes: [{ type: String, trim: true }],
    impactUnit: { type: String, required: true, default: 'tCO2e' },
    defaultCreditingPeriodYears: { type: Number, default: 20 },
    iconUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const ProjectType = mongoose.model<IProjectType>('ProjectType', ProjectTypeSchema);

