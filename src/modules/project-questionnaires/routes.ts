import { Router } from 'express';
import { getTemplateByType, createTemplate, saveAnswers, getProjectAnswers } from './controller';
import { validateAnswerSubmission } from './validations';
import { authenticate } from '../auth/middleware';
import { checkQuestionnaireEditable } from './middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

router.get('/templates/:projectType', authenticate, getTemplateByType);
router.post('/templates', authenticate, requireRole(['admin']), createTemplate);
router.post('/answers', authenticate, checkQuestionnaireEditable, validateAnswerSubmission, saveAnswers);
router.get('/answers/:projectId', authenticate, getProjectAnswers);

export default router;
