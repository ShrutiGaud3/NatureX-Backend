import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: string;
  key: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    description: { type: String },
    permissions: [{ type: String }],
    isSystem: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Role = mongoose.model<IRole>('Role', RoleSchema);
