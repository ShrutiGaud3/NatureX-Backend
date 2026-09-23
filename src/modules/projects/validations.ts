import { Request, Response, NextFunction } from 'express';

const VALID_PROJECT_TYPES = ['carbon', 'water', 'biodiversity', 'agroforestry', 'regenerative_ag'];
const VALID_STANDARDS = ['verra_vcs', 'gold_standard', 'art_trees', 'naturex_internal', 'other'];
const VALID_IMPACT_STAGES = ['estimated', 'measured', 'reviewed', 'verified'];

export const validateCreateProject = (req: Request, res: Response, next: NextFunction): void => {
  const { name, projectType, landId, standard, creditingPeriodYears } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ success: false, message: 'Project name is required' });
    return;
  }

  if (!projectType || !VALID_PROJECT_TYPES.includes(projectType)) {
    res.status(400).json({
      success: false,
      message: `projectType must be one of: ${VALID_PROJECT_TYPES.join(', ')}`
    });
    return;
  }

  if (!landId) {
    res.status(400).json({ success: false, message: 'landId is required' });
    return;
  }

  if (standard && !VALID_STANDARDS.includes(standard)) {
    res.status(400).json({
      success: false,
      message: `standard must be one of: ${VALID_STANDARDS.join(', ')}`
    });
    return;
  }

  if (creditingPeriodYears !== undefined && (isNaN(Number(creditingPeriodYears)) || Number(creditingPeriodYears) <= 0)) {
    res.status(400).json({ success: false, message: 'creditingPeriodYears must be a positive number' });
    return;
  }

  next();
};

export const validateUpdateProject = (req: Request, res: Response, next: NextFunction): void => {
  const { projectType, standard, creditingPeriodYears } = req.body;

  if (projectType && !VALID_PROJECT_TYPES.includes(projectType)) {
    res.status(400).json({
      success: false,
      message: `projectType must be one of: ${VALID_PROJECT_TYPES.join(', ')}`
    });
    return;
  }

  if (standard && !VALID_STANDARDS.includes(standard)) {
    res.status(400).json({
      success: false,
      message: `standard must be one of: ${VALID_STANDARDS.join(', ')}`
    });
    return;
  }

  if (creditingPeriodYears !== undefined && (isNaN(Number(creditingPeriodYears)) || Number(creditingPeriodYears) <= 0)) {
    res.status(400).json({ success: false, message: 'creditingPeriodYears must be a positive number' });
    return;
  }

  next();
};

export const validateProjectReview = (req: Request, res: Response, next: NextFunction): void => {
  const { action, reason, question, note } = req.body;
  const validActions = [
    'screen_accept',
    'move_to_mrv',
    'move_to_tech_review',
    'move_to_verification',
    'approve_final',
    'activate',
    'complete',
    'reject',
    'clarify',
    'suspend'
  ];

  if (!action || !validActions.includes(action)) {
    res.status(400).json({
      success: false,
      message: `Action must be one of: ${validActions.join(', ')}`
    });
    return;
  }

  if (action === 'reject' && (!reason || reason.trim().length === 0)) {
    res.status(400).json({ success: false, message: 'Rejection reason is mandatory when rejecting a project.' });
    return;
  }

  if (action === 'clarify' && (!question || question.trim().length === 0)) {
    res.status(400).json({ success: false, message: 'Clarification question is mandatory when asking for clarification.' });
    return;
  }

  next();
};

export const validateImpactUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { stage, amount, unit } = req.body;

  if (!stage || !VALID_IMPACT_STAGES.includes(stage)) {
    res.status(400).json({
      success: false,
      message: `stage must be one of: ${VALID_IMPACT_STAGES.join(', ')}`
    });
    return;
  }

  if (amount === undefined || isNaN(Number(amount)) || Number(amount) < 0) {
    res.status(400).json({ success: false, message: 'amount must be a non-negative number' });
    return;
  }

  next();
};

