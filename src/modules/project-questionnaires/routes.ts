import { Router } from 'express';
import {
  getTemplates,
  getTemplateByType,
  createTemplate,
  updateTemplate,
  saveAnswers,
  getProjectAnswers,
  reviewProjectAnswers,
  seedDefaultQuestionnaires
} from './controller';
import { validateCreateTemplate, validateAnswerSubmission, validateReviewAnswers } from './validations';
import { authenticate } from '../auth/middleware';
import { checkQuestionnaireEditable } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

// Template Management
router.post('/templates/seed', authenticate, seedDefaultQuestionnaires);
router.get('/templates', authenticate, getTemplates);
router.get('/templates/:projectType', authenticate, getTemplateByType);
router.post('/templates', authenticate, requireRole(['admin']), validateCreateTemplate, createTemplate);
router.put('/templates/:id', authenticate, requireRole(['admin']), updateTemplate);

// Project Answer Flow
router.post('/answers', authenticate, checkQuestionnaireEditable, validateAnswerSubmission, saveAnswers);
router.get('/answers/:projectId', authenticate, getProjectAnswers);
router.post('/answers/:projectId/review', authenticate, requireRole(['admin', 'field_agent']), validateReviewAnswers, reviewProjectAnswers);

export default router;

