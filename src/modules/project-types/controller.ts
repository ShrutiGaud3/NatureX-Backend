import { Request, Response } from 'express';
import { ProjectType } from './model';

export const getProjectTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const types = await ProjectType.find({ isActive: true });
    res.status(200).json({ success: true, count: types.length, data: types });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProjectType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, name, description, allowedPractices, requiredEvidenceTypes } = req.body;
    const type = await ProjectType.create({ key, name, description, allowedPractices, requiredEvidenceTypes });
    res.status(201).json({ success: true, message: 'Project type created', data: type });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
