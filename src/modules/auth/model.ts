import mongoose, { Document, Schema } from 'mongoose';

export interface IOtpSession extends Document {
  phone: string;
  countryCode: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isVerified: boolean;
  role?: 'farmer' | 'organization' | 'field_agent' | 'admin';
  deviceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OtpSessionSchema = new Schema<IOtpSession>(
  {
    phone: { type: String, required: true, index: true },
    countryCode: { type: String, default: '+91' },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    isVerified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ['farmer', 'organization', 'field_agent', 'admin'],
      default: 'farmer'
    },
    deviceId: { type: String }
  },
  { timestamps: true }
);

export const OtpSession = mongoose.model<IOtpSession>('OtpSession', OtpSessionSchema);
