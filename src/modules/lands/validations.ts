import { Request, Response, NextFunction } from 'express';

const VALID_OWNERSHIP_TYPES = ['owned', 'leased', 'community', 'shared'];
const VALID_IRRIGATION_SOURCES = ['canal', 'borewell', 'rainfed', 'river', 'drip', 'other'];

export const validateCreateLand = (req: Request, res: Response, next: NextFunction): void => {
  const { landName, village, district, state, areaInAcres, ownershipType, irrigationSource } = req.body;

  if (!landName || typeof landName !== 'string' || landName.trim().length === 0) {
    res.status(400).json({ success: false, message: 'Land name/parcel identifier is required.' });
    return;
  }

  if (!village || !district || !state) {
    res.status(400).json({ success: false, message: 'Village, district, and state are mandatory fields.' });
    return;
  }

  if (areaInAcres === undefined || isNaN(Number(areaInAcres)) || Number(areaInAcres) <= 0) {
    res.status(400).json({ success: false, message: 'Valid positive area in acres is required.' });
    return;
  }

  if (ownershipType && !VALID_OWNERSHIP_TYPES.includes(ownershipType)) {
    res.status(400).json({
      success: false,
      message: `ownershipType must be one of: ${VALID_OWNERSHIP_TYPES.join(', ')}`
    });
    return;
  }

  if (irrigationSource && !VALID_IRRIGATION_SOURCES.includes(irrigationSource)) {
    res.status(400).json({
      success: false,
      message: `irrigationSource must be one of: ${VALID_IRRIGATION_SOURCES.join(', ')}`
    });
    return;
  }

  next();
};

export const validateUpdateLand = (req: Request, res: Response, next: NextFunction): void => {
  const { areaInAcres, ownershipType, irrigationSource } = req.body;

  if (areaInAcres !== undefined && (isNaN(Number(areaInAcres)) || Number(areaInAcres) <= 0)) {
    res.status(400).json({ success: false, message: 'Area in acres must be a positive number.' });
    return;
  }

  if (ownershipType && !VALID_OWNERSHIP_TYPES.includes(ownershipType)) {
    res.status(400).json({
      success: false,
      message: `ownershipType must be one of: ${VALID_OWNERSHIP_TYPES.join(', ')}`
    });
    return;
  }

  if (irrigationSource && !VALID_IRRIGATION_SOURCES.includes(irrigationSource)) {
    res.status(400).json({
      success: false,
      message: `irrigationSource must be one of: ${VALID_IRRIGATION_SOURCES.join(', ')}`
    });
    return;
  }

  next();
};

export const validateLandReview = (req: Request, res: Response, next: NextFunction): void => {
  const { action, reason, question, notes } = req.body;
  const validActions = ['approve', 'reject', 'clarify', 'conflict'];

  if (!action || !validActions.includes(action)) {
    res.status(400).json({
      success: false,
      message: `Action must be one of: ${validActions.join(', ')}`
    });
    return;
  }

  if (action === 'reject' && (!reason || reason.trim().length === 0)) {
    res.status(400).json({ success: false, message: 'Rejection reason is mandatory when rejecting land parcel.' });
    return;
  }

  if (action === 'clarify' && (!question || question.trim().length === 0)) {
    res.status(400).json({ success: false, message: 'Clarification question is mandatory when asking for clarification.' });
    return;
  }

  if (action === 'conflict' && (!notes || notes.trim().length === 0)) {
    res.status(400).json({ success: false, message: 'Conflict notes/details are mandatory when flagging boundary conflict.' });
    return;
  }

  next();
};

