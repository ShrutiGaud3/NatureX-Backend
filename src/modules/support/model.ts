import mongoose, { Document, Schema } from 'mongoose';

export type TicketCategory =
  | 'kyc'
  | 'land_boundary'
  | 'payout_issue'
  | 'mrv_audit'
  | 'field_visit'
  | 'app_issue'
  | 'program_enrollment'
  | 'general_inquiry';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_on_farmer'
  | 'resolved'
  | 'closed';

export interface ITicketResponse {
  responseCode: string;
  senderId: mongoose.Types.ObjectId;
  senderRole: string;
  message: string;
  attachments?: Array<{ fileUrl: string; fileName: string }>;
  sentAt: Date;
}

export interface ISupportTicket extends Document {
  ticketCode: string;
  userId: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  landId?: mongoose.Types.ObjectId;
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  attachments?: Array<{
    fileUrl: string;
    fileName: string;
    fileType?: string;
    uploadedAt: Date;
  }>;
  responses: ITicketResponse[];
  resolutionDetails?: {
    resolvedAt?: Date;
    resolvedBy?: mongoose.Types.ObjectId;
    resolutionSummary?: string;
    satisfactionRating?: number;
    feedbackNotes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketCode: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    landId: { type: Schema.Types.ObjectId, ref: 'Land' },
    category: {
      type: String,
      required: true,
      enum: [
        'kyc',
        'land_boundary',
        'payout_issue',
        'mrv_audit',
        'field_visit',
        'app_issue',
        'program_enrollment',
        'general_inquiry'
      ],
      index: true
    },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting_on_farmer', 'resolved', 'closed'],
      default: 'open',
      index: true
    },
    attachments: [
      {
        fileUrl: { type: String, required: true },
        fileName: { type: String, required: true },
        fileType: { type: String },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    responses: [
      {
        responseCode: { type: String, required: true },
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        senderRole: { type: String, default: 'user' },
        message: { type: String, required: true },
        attachments: [
          {
            fileUrl: { type: String },
            fileName: { type: String }
          }
        ],
        sentAt: { type: Date, default: Date.now }
      }
    ],
    resolutionDetails: {
      resolvedAt: { type: Date },
      resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      resolutionSummary: { type: String },
      satisfactionRating: { type: Number, min: 1, max: 5 },
      feedbackNotes: { type: String }
    }
  },
  { timestamps: true }
);

SupportTicketSchema.index({ status: 1, priority: 1 });
SupportTicketSchema.index({ userId: 1, createdAt: -1 });

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
