import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  phone: string;
  fullName?: string;
  photoUrl?: string;
  dob?: Date;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  village?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  preferredLanguage: 'en' | 'hi';
  role: 'farmer' | 'organization' | 'field_agent' | 'admin' | 'unassigned';
  status: 'draft' | 'submitted' | 'active' | 'suspended';
  organizationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    phone: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, trim: true },
    photoUrl: { type: String },
    dob: { type: Date },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    village: { type: String },
    city: { type: String },
    district: { type: String },
    state: { type: String },
    pincode: { type: String },
    preferredLanguage: { type: String, default: 'en', enum: ['en', 'hi'] },
    role: {
      type: String,
      enum: ['farmer', 'organization', 'field_agent', 'admin', 'unassigned'],
      default: 'unassigned'
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'active', 'suspended'],
      default: 'draft'
    },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
