import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectType extends Document {
  key: 'carbon' | 'water' | 'biodiversity' | string;
  name: string;
  description: string;
  allowedPractices: string[];
  requiredEvidenceTypes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectTypeSchema = new Schema<IProjectType>(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    allowedPractices: [{ type: String }],
    requiredEvidenceTypes: [{ type: String }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const ProjectType = mongoose.model<IProjectType>('ProjectType', ProjectTypeSchema);
