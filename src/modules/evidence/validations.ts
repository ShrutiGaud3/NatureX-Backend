import { Request, Response, NextFunction } from 'express';

const VALID_EVIDENCE_TYPES = [
  'photo',
  'video',
  'document',
  'measurement',
  'gps',
  'drone_orthomosaic',
  'lab_report'
];

const VALID_CATEGORIES = [
  'baseline_soil_test',
  'periodic_soil_test',
  'tree_biomass_photo',
  'drone_canopy_survey',
  'water_flow_meter',
  'farmer_consent_signature',
  'land_boundary_audit',
  'general'
];

export const validateEvidenceUpload = (req: Request, res: Response, next: NextFunction): void => {
  const { projectId, evidenceType, title, fileUrl, category, captureLocation } = req.body;

  if (!projectId || typeof projectId !== 'string') {
    res.status(400).json({ success: false, message: 'Valid projectId is required.' });
    return;
  }

  if (!evidenceType || !VALID_EVIDENCE_TYPES.includes(evidenceType)) {
    res.status(400).json({
      success: false,
      message: `Valid evidenceType is required. Allowed types: ${VALID_EVIDENCE_TYPES.join(', ')}`
    });
    return;
  }

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ success: false, message: 'Evidence title is required.' });
    return;
  }

  if (!fileUrl || typeof fileUrl !== 'string' || fileUrl.trim().length === 0) {
    res.status(400).json({ success: false, message: 'Valid fileUrl is required.' });
    return;
  }

  if (category && !VALID_CATEGORIES.includes(category)) {
    res.status(400).json({
      success: false,
      message: `Invalid category. Allowed categories: ${VALID_CATEGORIES.join(', ')}`
    });
    return;
  }

  if (captureLocation) {
    const { latitude, longitude } = captureLocation;
    if (
      latitude !== undefined &&
      (isNaN(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90)
    ) {
      res.status(400).json({ success: false, message: 'Latitude must be a valid number between -90 and 90.' });
      return;
    }
    if (
      longitude !== undefined &&
      (isNaN(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180)
    ) {
      res.status(400).json({ success: false, message: 'Longitude must be a valid number between -180 and 180.' });
      return;
    }
  }

  next();
};

export const validateBatchUploadEvidence = (req: Request, res: Response, next: NextFunction): void => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Batch upload requires a non-empty "items" array.'
    });
    return;
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.projectId || !item.evidenceType || !item.title || !item.fileUrl) {
      res.status(400).json({
        success: false,
        message: `Item at index ${i} is missing one of required fields: projectId, evidenceType, title, fileUrl.`
      });
      return;
    }
    if (!VALID_EVIDENCE_TYPES.includes(item.evidenceType)) {
      res.status(400).json({
        success: false,
        message: `Item at index ${i} has invalid evidenceType '${item.evidenceType}'.`
      });
      return;
    }
  }

  next();
};

export const validateReviewEvidence = (req: Request, res: Response, next: NextFunction): void => {
  const { action, status, rejectionReason } = req.body;
  const validActions = ['verify', 'flag', 'reject', 'under_review'];
  const validStatuses = ['verified', 'flagged', 'rejected', 'under_review'];

  const target = action || status;

  if (!target || (!validActions.includes(target) && !validStatuses.includes(target))) {
    res.status(400).json({
      success: false,
      message: 'Review action must be one of: verify, flag, reject, under_review (or verified, flagged, rejected).'
    });
    return;
  }

  if ((target === 'reject' || target === 'rejected') && !rejectionReason && !req.body.notes) {
    res.status(400).json({
      success: false,
      message: 'Rejection reason or review notes are required when rejecting evidence.'
    });
    return;
  }

  next();
};

