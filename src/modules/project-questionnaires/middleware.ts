import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { Project } from '../projects/model';

export const checkQuestionnaireEditable = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const projectId = req.body.projectId || req.params.projectId;
    if (!projectId) return next();

    const project = await Project.findById(projectId);
    if (project && ['approved', 'completed'].includes(project.status)) {
      res.status(400).json({ success: false, message: 'Questionnaire cannot be edited for approved or completed projects' });
      return;
    }
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
