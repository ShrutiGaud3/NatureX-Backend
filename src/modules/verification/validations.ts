import { Request, Response, NextFunction } from 'express';

const VALID_STANDARDS = ['verra_vcs', 'gold_standard', 'art_trees', 'naturex_internal', 'iso_14064'];
const VALID_AUDIT_TYPES = ['desk_review', 'field_visit', 'hybrid', 'periodic_issuance'];
const VALID_DECISION_STATUSES = ['approved', 'rejected'];

export const validateCreateVerification = (req: Request, res: Response, next: NextFunction): void => {
  const { projectId, assignedAgencyName, verificationStandard, auditType } = req.body;

  if (!projectId) {
    res.status(400).json({ success: false, message: 'projectId is required' });
    return;
  }

  if (!assignedAgencyName || typeof assignedAgencyName !== 'string' || !assignedAgencyName.trim()) {
    res.status(400).json({ success: false, message: 'assignedAgencyName is required' });
    return;
  }

  if (verificationStandard && !VALID_STANDARDS.includes(verificationStandard)) {
    res.status(400).json({
      success: false,
      message: `verificationStandard must be one of: ${VALID_STANDARDS.join(', ')}`
    });
    return;
  }

  if (auditType && !VALID_AUDIT_TYPES.includes(auditType)) {
    res.status(400).json({
      success: false,
      message: `auditType must be one of: ${VALID_AUDIT_TYPES.join(', ')}`
    });
    return;
  }

  next();
};

export const validateSubmitReport = (req: Request, res: Response, next: NextFunction): void => {
  const { auditReportUrl } = req.body;

  if (!auditReportUrl || typeof auditReportUrl !== 'string' || !auditReportUrl.trim()) {
    res.status(400).json({ success: false, message: 'auditReportUrl is required' });
    return;
  }

  next();
};

export const validateVerificationDecision = (req: Request, res: Response, next: NextFunction): void => {
  const { status, decisionNotes, verifiedCredits } = req.body;

  if (!status || !VALID_DECISION_STATUSES.includes(status)) {
    res.status(400).json({
      success: false,
      message: `Valid decision status (${VALID_DECISION_STATUSES.join(', ')}) is required`
    });
    return;
  }

  if (status === 'rejected' && (!decisionNotes || !decisionNotes.trim())) {
    res.status(400).json({
      success: false,
      message: 'decisionNotes is required when rejecting a verification case'
    });
    return;
  }

  if (status === 'approved' && verifiedCredits !== undefined && (typeof verifiedCredits !== 'number' || verifiedCredits < 0)) {
    res.status(400).json({
      success: false,
      message: 'verifiedCredits must be a non-negative number'
    });
    return;
  }

  next();
};

export const validateIssueCertificate = (req: Request, res: Response, next: NextFunction): void => {
  const { certificateNumber, externalRegistryReference } = req.body;

  if (certificateNumber && typeof certificateNumber !== 'string') {
    res.status(400).json({ success: false, message: 'certificateNumber must be a string' });
    return;
  }

  next();
};
