import mongoose, { Document, Schema } from 'mongoose';

export type QuestionType =
  | 'text'
  | 'number'
  | 'dropdown'
  | 'multi-select'
  | 'yes-no'
  | 'date'
  | 'gps'
  | 'photo'
  | 'document'
  | 'measurement';

export interface IQuestion {
  questionKey: string;
  label: string;
  type: QuestionType;
  unit?: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  displayOrder?: number;
}

export interface IQuestionnaireSection {
  sectionKey: string;
  title: string;
  description?: string;
  displayOrder?: number;
  questions: IQuestion[];
}

export interface IQuestionnaireTemplate extends Document {
  projectType: string;
  title: string;
  description?: string;
  version: number;
  sections: IQuestionnaireSection[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    questionKey: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['text', 'number', 'dropdown', 'multi-select', 'yes-no', 'date', 'gps', 'photo', 'document', 'measurement']
    },
    unit: { type: String, trim: true },
    required: { type: Boolean, default: false },
    options: [{ type: String, trim: true }],
    placeholder: { type: String },
    helpText: { type: String },
    displayOrder: { type: Number, default: 0 }
  },
  { _id: false }
);

const QuestionnaireSectionSchema = new Schema<IQuestionnaireSection>(
  {
    sectionKey: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    displayOrder: { type: Number, default: 0 },
    questions: [QuestionSchema]
  },
  { _id: false }
);

const QuestionnaireTemplateSchema = new Schema<IQuestionnaireTemplate>(
  {
    projectType: {
      type: String,
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    version: { type: Number, required: true, default: 1 },
    sections: [QuestionnaireSectionSchema],
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

export const QuestionnaireTemplate = mongoose.model<IQuestionnaireTemplate>(
  'QuestionnaireTemplate',
  QuestionnaireTemplateSchema
);

export interface IProjectAnswer extends Document {
  projectId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  version: number;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'clarification';
  answers: Map<string, any>;
  completionPercentage: number;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectAnswerSchema = new Schema<IProjectAnswer>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'QuestionnaireTemplate', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'reviewed', 'approved', 'clarification'],
      default: 'draft',
      index: true
    },
    answers: { type: Map, of: Schema.Types.Mixed, default: {} },
    completionPercentage: { type: Number, default: 0 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String }
  },
  { timestamps: true }
);

export const ProjectAnswer = mongoose.model<IProjectAnswer>('ProjectAnswer', ProjectAnswerSchema);

