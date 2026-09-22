import { Request, Response, NextFunction } from 'express';

export const validateCreateOrg = (req: Request, res: Response, next: NextFunction): void => {
  const { name, type, state, district } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ success: false, message: 'Organization name is required.' });
    return;
  }

  if (!type || !['fpo', 'ngo', 'project_developer', 'corporate'].includes(type)) {
    res.status(400).json({
      success: false,
      message: 'Valid organization type is required: fpo, ngo, project_developer, corporate'
    });
    return;
  }

  if (!state || !district) {
    res.status(400).json({ success: false, message: 'State and District are required.' });
    return;
  }

  next();
};

export const validateInviteFarmer = (req: Request, res: Response, next: NextFunction): void => {
  const { phone } = req.body;

  if (!phone || typeof phone !== 'string' || !/^[6-9]\d{9}$/.test(phone.trim())) {
    res.status(400).json({
      success: false,
      message: 'Valid 10-digit Indian mobile number starting with 6-9 is required for farmer.'
    });
    return;
  }

  next();
};

export const validateBulkImportFarmers = (req: Request, res: Response, next: NextFunction): void => {
  const { farmers } = req.body;

  if (!farmers || !Array.isArray(farmers) || farmers.length === 0) {
    res.status(400).json({
      success: false,
      message: 'An array of farmers is required with at least one record.'
    });
    return;
  }

  for (let i = 0; i < farmers.length; i++) {
    const f = farmers[i];
    if (!f.phone || !/^[6-9]\d{9}$/.test(String(f.phone).trim())) {
      res.status(400).json({
        success: false,
        message: `Invalid phone number at row index ${i}: '${f.phone}'. Must be a 10-digit Indian mobile number.`
      });
      return;
    }
  }

  next();
};

export const validateAddTeamMember = (req: Request, res: Response, next: NextFunction): void => {
  const { phone, role } = req.body;

  if (!phone || typeof phone !== 'string' || !/^[6-9]\d{9}$/.test(phone.trim())) {
    res.status(400).json({
      success: false,
      message: 'Valid 10-digit Indian mobile number is required for team member.'
    });
    return;
  }

  if (!role || !['admin', 'project_manager', 'field_coordinator', 'viewer'].includes(role)) {
    res.status(400).json({
      success: false,
      message: 'Valid member role is required: admin, project_manager, field_coordinator, viewer'
    });
    return;
  }

  next();
};

export const validateOrgReview = (req: Request, res: Response, next: NextFunction): void => {
  const { action, reason, question } = req.body;

  if (!action || !['approve', 'reject', 'clarify', 'suspend'].includes(action)) {
    res.status(400).json({
      success: false,
      message: 'Valid action is required: approve, reject, clarify, suspend'
    });
    return;
  }

  if (action === 'reject' && (!reason || reason.trim().length === 0)) {
    res.status(400).json({ success: false, message: 'Rejection reason is mandatory.' });
    return;
  }

  if (action === 'clarify' && (!question || question.trim().length === 0)) {
    res.status(400).json({ success: false, message: 'Clarification question is mandatory.' });
    return;
  }

  next();
};
