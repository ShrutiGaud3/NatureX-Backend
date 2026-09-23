import { Request, Response, NextFunction } from 'express';

export const validateCreateMrv = (req: Request, res: Response, next: NextFunction): void => {
  const { projectId, methodology, reportingPeriod } = req.body;

  if (!projectId || typeof projectId !== 'string') {
    res.status(400).json({ success: false, message: 'Valid projectId is required.' });
    return;
  }

  if (!methodology || typeof methodology !== 'string' || methodology.trim().length === 0) {
    res.status(400).json({ success: false, message: 'Quantification methodology is required.' });
    return;
  }

  if (!reportingPeriod || !reportingPeriod.startDate || !reportingPeriod.endDate) {
    res.status(400).json({
      success: false,
      message: 'reportingPeriod object containing startDate and endDate is mandatory.'
    });
    return;
  }

  if (
    isNaN(Date.parse(reportingPeriod.startDate)) ||
    isNaN(Date.parse(reportingPeriod.endDate))
  ) {
    res.status(400).json({
      success: false,
      message: 'reportingPeriod dates must be valid ISO date strings.'
    });
    return;
  }

  next();
};

export const validateCalculateMrv = (req: Request, res: Response, next: NextFunction): void => {
  const { projectId, baselineNdvi, currentNdvi, totalAreaInAcres } = req.body;

  if (!projectId) {
    res.status(400).json({ success: false, message: 'projectId is required for remote sensing calculation.' });
    return;
  }

  if (baselineNdvi !== undefined && (isNaN(Number(baselineNdvi)) || Number(baselineNdvi) < -1 || Number(baselineNdvi) > 1)) {
    res.status(400).json({ success: false, message: 'baselineNdvi must be a value between -1.0 and 1.0.' });
    return;
  }

  if (currentNdvi !== undefined && (isNaN(Number(currentNdvi)) || Number(currentNdvi) < -1 || Number(currentNdvi) > 1)) {
    res.status(400).json({ success: false, message: 'currentNdvi must be a value between -1.0 and 1.0.' });
    return;
  }

  if (totalAreaInAcres !== undefined && (isNaN(Number(totalAreaInAcres)) || Number(totalAreaInAcres) <= 0)) {
    res.status(400).json({ success: false, message: 'totalAreaInAcres must be a positive number.' });
    return;
  }

  next();
};

export const validateReviewMrv = (req: Request, res: Response, next: NextFunction): void => {
  const { action, auditOpinion } = req.body;
  const validActions = ['verify', 'reject', 'clarify', 'under_review'];
  const validOpinions = ['unqualified_pass', 'qualified_pass', 'fail', 're_audit_required'];

  if (!action || !validActions.includes(action)) {
    res.status(400).json({
      success: false,
      message: `Review action must be one of: ${validActions.join(', ')}`
    });
    return;
  }

  if (action === 'verify' && auditOpinion && !validOpinions.includes(auditOpinion)) {
    res.status(400).json({
      success: false,
      message: `auditOpinion must be one of: ${validOpinions.join(', ')}`
    });
    return;
  }

  next();
};

