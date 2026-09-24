import { Request, Response, NextFunction } from 'express';

const VALID_PROGRAM_TYPES = [
  'carbon_incentive',
  'water_replenishment',
  'regenerative_agriculture',
  'agroforestry_subsidy',
  'biodiversity_restoration'
];

const VALID_PROGRAM_STATUSES = ['draft', 'active', 'paused', 'closed', 'completed'];
const VALID_ENROLLMENT_STATUSES = ['applied', 'verified', 'active', 'completed', 'rejected', 'withdrawn'];

export const validateCreateProgram = (req: Request, res: Response, next: NextFunction): void => {
  const { name, sponsorName, programType, financials, timeline } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ success: false, message: 'Program name is required' });
    return;
  }

  if (!sponsorName || typeof sponsorName !== 'string' || !sponsorName.trim()) {
    res.status(400).json({ success: false, message: 'Sponsor name is required' });
    return;
  }

  if (programType && !VALID_PROGRAM_TYPES.includes(programType)) {
    res.status(400).json({
      success: false,
      message: `Invalid programType. Must be one of: ${VALID_PROGRAM_TYPES.join(', ')}`
    });
    return;
  }

  if (financials) {
    if (financials.budgetTotal !== undefined && (typeof financials.budgetTotal !== 'number' || financials.budgetTotal < 0)) {
      res.status(400).json({ success: false, message: 'budgetTotal must be a non-negative number' });
      return;
    }
    if (financials.incentivePerAcre !== undefined && (typeof financials.incentivePerAcre !== 'number' || financials.incentivePerAcre < 0)) {
      res.status(400).json({ success: false, message: 'incentivePerAcre must be a non-negative number' });
      return;
    }
  }

  if (timeline) {
    if (timeline.startDate && isNaN(Date.parse(timeline.startDate))) {
      res.status(400).json({ success: false, message: 'Valid startDate is required in timeline' });
      return;
    }
    if (timeline.endDate && isNaN(Date.parse(timeline.endDate))) {
      res.status(400).json({ success: false, message: 'Valid endDate is required in timeline' });
      return;
    }
    if (timeline.startDate && timeline.endDate && new Date(timeline.startDate) > new Date(timeline.endDate)) {
      res.status(400).json({ success: false, message: 'startDate cannot be after endDate' });
      return;
    }
  }

  next();
};

export const validateUpdateProgram = (req: Request, res: Response, next: NextFunction): void => {
  const { programType, status, financials, timeline } = req.body;

  if (programType && !VALID_PROGRAM_TYPES.includes(programType)) {
    res.status(400).json({
      success: false,
      message: `Invalid programType. Must be one of: ${VALID_PROGRAM_TYPES.join(', ')}`
    });
    return;
  }

  if (status && !VALID_PROGRAM_STATUSES.includes(status)) {
    res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${VALID_PROGRAM_STATUSES.join(', ')}`
    });
    return;
  }

  if (financials) {
    if (financials.budgetTotal !== undefined && (typeof financials.budgetTotal !== 'number' || financials.budgetTotal < 0)) {
      res.status(400).json({ success: false, message: 'budgetTotal must be a non-negative number' });
      return;
    }
  }

  if (timeline) {
    if (timeline.startDate && isNaN(Date.parse(timeline.startDate))) {
      res.status(400).json({ success: false, message: 'Valid startDate is required' });
      return;
    }
    if (timeline.endDate && isNaN(Date.parse(timeline.endDate))) {
      res.status(400).json({ success: false, message: 'Valid endDate is required' });
      return;
    }
  }

  next();
};

export const validateEnrollProgram = (req: Request, res: Response, next: NextFunction): void => {
  const { projectId, landId, enrolledAcreage } = req.body;

  if (!projectId) {
    res.status(400).json({ success: false, message: 'projectId is required for enrollment' });
    return;
  }

  if (!landId) {
    res.status(400).json({ success: false, message: 'landId is required for enrollment' });
    return;
  }

  if (enrolledAcreage === undefined || typeof enrolledAcreage !== 'number' || enrolledAcreage <= 0) {
    res.status(400).json({ success: false, message: 'enrolledAcreage must be a positive number' });
    return;
  }

  next();
};

export const validateReviewEnrollment = (req: Request, res: Response, next: NextFunction): void => {
  const { status, rejectionReason, totalPayoutEarned } = req.body;

  if (!status || !VALID_ENROLLMENT_STATUSES.includes(status)) {
    res.status(400).json({
      success: false,
      message: `status is required and must be one of: ${VALID_ENROLLMENT_STATUSES.join(', ')}`
    });
    return;
  }

  if (status === 'rejected' && (!rejectionReason || !rejectionReason.trim())) {
    res.status(400).json({
      success: false,
      message: 'rejectionReason is required when status is rejected'
    });
    return;
  }

  if (totalPayoutEarned !== undefined && (typeof totalPayoutEarned !== 'number' || totalPayoutEarned < 0)) {
    res.status(400).json({ success: false, message: 'totalPayoutEarned must be a non-negative number' });
    return;
  }

  next();
};
