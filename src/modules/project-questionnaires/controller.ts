import { Request, Response } from 'express';
import { QuestionnaireTemplate, ProjectAnswer } from './model';

export const getTemplateByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectType } = req.params;
    const template = await QuestionnaireTemplate.findOne({
      projectType,
      isActive: true
    }).sort({ version: -1 });

    if (!template) {
      res.status(404).json({ success: false, message: `No active template found for project type ${projectType}` });
      return;
    }
    res.status(200).json({ success: true, data: template });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectType, version = 1, sections } = req.body;
    const template = await QuestionnaireTemplate.create({ projectType, version, sections });
    res.status(201).json({ success: true, message: 'Questionnaire template created', data: template });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveAnswers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, templateId, version = 1, answers } = req.body;
    const projectAnswer = await ProjectAnswer.findOneAndUpdate(
      { projectId },
      { $set: { templateId, version, answers } },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, message: 'Answers saved successfully', data: projectAnswer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectAnswers = async (req: Request, res: Response): Promise<void> => {
  try {
    const answers = await ProjectAnswer.findOne({ projectId: req.params.projectId }).populate('templateId');
    if (!answers) {
      res.status(404).json({ success: false, message: 'No answers found for this project' });
      return;
    }
    res.status(200).json({ success: true, data: answers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
