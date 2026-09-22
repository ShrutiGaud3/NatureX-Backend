import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: string;
  key: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    permissions: [{ type: String }],
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Role = mongoose.model<IRole>('Role', RoleSchema);
