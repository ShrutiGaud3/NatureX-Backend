import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  type: 'fpo' | 'ngo' | 'project_developer' | 'corporate';
  registrationNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  district?: string;
  state?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'clarification';
  clarificationReason?: string;
  rejectionReason?: string;
  createdBy: mongoose.Types.ObjectId;
  members: Array<{
    userId: mongoose.Types.ObjectId;
    role: 'admin' | 'project_manager' | 'field_coordinator' | 'viewer';
    joinedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['fpo', 'ngo', 'project_developer', 'corporate']
    },
    registrationNumber: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    address: { type: String },
    district: { type: String },
    state: { type: String },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'clarification'],
      default: 'draft'
    },
    clarificationReason: { type: String },
    rejectionReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        role: {
          type: String,
          enum: ['admin', 'project_manager', 'field_coordinator', 'viewer'],
          default: 'admin'
        },
        joinedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
