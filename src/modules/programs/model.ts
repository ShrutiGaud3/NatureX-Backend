import mongoose, { Document, Schema } from 'mongoose';

export interface IProgram extends Document {
  name: string;
  sponsorName: string;
  description?: string;
  budgetTotal?: number;
  eligibleProjectTypes: string[];
  status: 'draft' | 'active' | 'closed';
  enrolledProjects: Array<{
    projectId: mongoose.Types.ObjectId;
    status: 'applied' | 'selected' | 'rejected';
    enrolledAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramSchema = new Schema<IProgram>(
  {
    name: { type: String, required: true, trim: true },
    sponsorName: { type: String, required: true },
    description: { type: String },
    budgetTotal: { type: Number },
    eligibleProjectTypes: [{ type: String }],
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'draft'
    },
    enrolledProjects: [
      {
        projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
        status: { type: String, enum: ['applied', 'selected', 'rejected'], default: 'applied' },
        enrolledAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const Program = mongoose.model<IProgram>('Program', ProgramSchema);
