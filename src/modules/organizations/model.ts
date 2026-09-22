import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  type: 'fpo' | 'ngo' | 'project_developer' | 'corporate';
  registrationNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  district: string;
  state: string;
  pincode?: string;
  documents?: Array<{
    documentType: string;
    documentUrl: string;
    uploadedAt: Date;
  }>;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'clarification' | 'suspended';
  clarificationReason?: string;
  rejectionReason?: string;
  createdBy: mongoose.Types.ObjectId;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  members: Array<{
    userId: mongoose.Types.ObjectId;
    role: 'admin' | 'project_manager' | 'field_coordinator' | 'viewer';
    joinedAt: Date;
  }>;
  associatedFarmers: Array<{
    farmerId?: mongoose.Types.ObjectId;
    phone: string;
    fullName?: string;
    village?: string;
    status: 'invited' | 'active' | 'rejected';
    invitedAt: Date;
    joinedAt?: Date;
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
    registrationNumber: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
    address: { type: String },
    district: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String },
    documents: [
      {
        documentType: { type: String, required: true },
        documentUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'clarification', 'suspended'],
      default: 'draft'
    },
    clarificationReason: { type: String },
    rejectionReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: {
          type: String,
          enum: ['admin', 'project_manager', 'field_coordinator', 'viewer'],
          default: 'admin'
        },
        joinedAt: { type: Date, default: Date.now }
      }
    ],
    associatedFarmers: [
      {
        farmerId: { type: Schema.Types.ObjectId, ref: 'User' },
        phone: { type: String, required: true },
        fullName: { type: String },
        village: { type: String },
        status: {
          type: String,
          enum: ['invited', 'active', 'rejected'],
          default: 'invited'
        },
        invitedAt: { type: Date, default: Date.now },
        joinedAt: { type: Date }
      }
    ]
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
