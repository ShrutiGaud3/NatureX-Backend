import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestionnaireTemplate extends Document {
  projectType: 'carbon' | 'water' | 'biodiversity';
  version: number;
  sections: Array<{
    sectionKey: string;
    title: string;
    description?: string;
    questions: Array<{
      questionKey: string;
      label: string;
      type: 'text' | 'number' | 'dropdown' | 'multi-select' | 'yes-no' | 'date' | 'gps' | 'photo' | 'document' | 'measurement';
      required: boolean;
      options?: string[];
      placeholder?: string;
      helpText?: string;
    }>;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionnaireTemplateSchema = new Schema<IQuestionnaireTemplate>(
  {
    projectType: {
      type: String,
      required: true,
      enum: ['carbon', 'water', 'biodiversity']
    },
    version: { type: Number, required: true, default: 1 },
    sections: [
      {
        sectionKey: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String },
        questions: [
          {
            questionKey: { type: String, required: true },
            label: { type: String, required: true },
            type: {
              type: String,
              required: true,
              enum: ['text', 'number', 'dropdown', 'multi-select', 'yes-no', 'date', 'gps', 'photo', 'document', 'measurement']
            },
            required: { type: Boolean, default: false },
            options: [String],
            placeholder: String,
            helpText: String
          }
        ]
      }
    ],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const QuestionnaireTemplate = mongoose.model<IQuestionnaireTemplate>('QuestionnaireTemplate', QuestionnaireTemplateSchema);

export interface IProjectAnswer extends Document {
  projectId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  version: number;
  answers: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectAnswerSchema = new Schema<IProjectAnswer>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'QuestionnaireTemplate', required: true },
    version: { type: Number, required: true },
    answers: { type: Map, of: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const ProjectAnswer = mongoose.model<IProjectAnswer>('ProjectAnswer', ProjectAnswerSchema);
