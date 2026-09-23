import { Response } from 'express';
import mongoose from 'mongoose';
import { FieldVisit, IChecklistItem, VisitType } from './model';
import { Project } from '../projects/model';
import { Land } from '../lands/model';
import { User } from '../users/model';
import { AuthRequest } from '../auth/middleware';

// Helper to generate unique visit code e.g. VIS-2024-8832
const generateVisitCode = (): string => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `VIS-${year}-${randomSuffix}`;
};

// Default checklist items by visit type
const getDefaultChecklist = (visitType: VisitType): IChecklistItem[] => {
  switch (visitType) {
    case 'soil_sampling':
      return [
        { itemKey: 'gps_coordinate_lock', label: 'GPS Coordinates locked at 4 sampling vertices', status: 'na' },
        { itemKey: 'depth_0_15_sampled', label: 'Topsoil 0-15cm core sample extracted', status: 'na' },
        { itemKey: 'depth_15_30_sampled', label: 'Subsoil 15-30cm core sample extracted', status: 'na' },
        { itemKey: 'sample_bag_qr_labeled', label: 'Sample collection bags sealed and QR labeled', status: 'na' },
        { itemKey: 'farmer_presence_verified', label: 'Farmer or authorized representative verified onsite', status: 'na' }
      ];
    case 'drone_monitoring':
      return [
        { itemKey: 'airspace_clearance', label: 'Local DGCA green zone / flight permission confirmed', status: 'na' },
        { itemKey: 'ground_control_points', label: 'Ground Control Points (GCPs) marked and recorded', status: 'na' },
        { itemKey: 'multispectral_capture', label: 'Multispectral (NDVI/NDRE) raster flight completed', status: 'na' },
        { itemKey: 'overlap_threshold_met', label: 'Minimum 75% front/side overlap achieved', status: 'na' }
      ];
    case 'practice_verification':
      return [
        { itemKey: 'cover_crop_standing', label: 'Cover crop species presence and canopy density verified', status: 'na' },
        { itemKey: 'no_residue_burning', label: 'Zero stubble burning signs observed on parcel', status: 'na' },
        { itemKey: 'micro_irrigation_operational', label: 'Drip or micro-sprinkler lines installed and functional', status: 'na' }
      ];
    default:
      return [
        { itemKey: 'parcel_boundary_walk', label: 'Parcel physical boundary walked and verified with farmer', status: 'na' },
        { itemKey: 'baseline_photos_captured', label: 'Cardinal direction baseline photos captured', status: 'na' },
        { itemKey: 'farmer_interview_completed', label: 'Management practice survey confirmed with farmer', status: 'na' }
      ];
  }
};

// 1. Create / Schedule a Field Visit
export const createVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      landId,
      assignedAgentId,
      scheduledDate,
      visitType = 'baseline_survey',
      checklist,
      notes
    } = req.body;

    const [project, land, agent] = await Promise.all([
      Project.findById(projectId),
      Land.findById(landId),
      User.findById(assignedAgentId)
    ]);

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }
    if (!land) {
      res.status(404).json({ success: false, message: 'Land parcel not found.' });
      return;
    }
    if (!agent) {
      res.status(404).json({ success: false, message: 'Assigned agent user record not found.' });
      return;
    }

    const visitCode = generateVisitCode();
    const finalChecklist = checklist && checklist.length > 0 ? checklist : getDefaultChecklist(visitType);

    const visit = await FieldVisit.create({
      visitCode,
      projectId,
      landId,
      assignedAgentId,
      createdBy: req.user?.id,
      visitType,
      scheduledDate: new Date(scheduledDate),
      checklist: finalChecklist,
      measurements: [],
      notes,
      status: 'assigned'
    });

    res.status(201).json({
      success: true,
      message: 'Field visit scheduled and assigned successfully.',
      data: visit
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. List Visits with Query Filters & Pagination
export const listVisits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      landId,
      assignedAgentId,
      status,
      visitType,
      startDate,
      endDate,
      page = '1',
      limit = '20'
    } = req.query;

    const filter: any = {};

    if (projectId) filter.projectId = projectId;
    if (landId) filter.landId = landId;
    if (assignedAgentId) filter.assignedAgentId = assignedAgentId;
    if (status) filter.status = status;
    if (visitType) filter.visitType = visitType;

    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(String(startDate));
      if (endDate) filter.scheduledDate.$lte = new Date(String(endDate));
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    const [visits, total] = await Promise.all([
      FieldVisit.find(filter)
        .populate('projectId', 'name code projectType standard status')
        .populate('landId', 'landName village district state surveyNumber areaInAcres')
        .populate('assignedAgentId', 'fullName phone role')
        .populate('createdBy', 'fullName phone role')
        .sort({ scheduledDate: -1 })
        .skip(skip)
        .limit(limitNum),
      FieldVisit.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: visits,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Visit Details by ID
export const getVisitById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const visit = await FieldVisit.findById(req.params.id)
      .populate('projectId', 'name code projectType standard status')
      .populate('landId', 'landName village district state surveyNumber areaInAcres coordinates')
      .populate('assignedAgentId', 'fullName phone role')
      .populate('createdBy', 'fullName phone role')
      .populate('evidenceIds');

    if (!visit) {
      res.status(404).json({ success: false, message: 'Field visit not found.' });
      return;
    }

    res.status(200).json({ success: true, data: visit });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get My Assigned Visits (Field Agent View)
export const getMyVisits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = { assignedAgentId: req.user?.id };

    if (status) filter.status = status;

    const visits = await FieldVisit.find(filter)
      .populate('projectId', 'name code projectType')
      .populate('landId', 'landName village district state surveyNumber')
      .sort({ scheduledDate: 1 });

    res.status(200).json({
      success: true,
      count: visits.length,
      data: visits
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Start Visit (Check-In)
export const startVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { checkInLocation } = req.body;

    const visit = await FieldVisit.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          startedAt: new Date(),
          checkInLocation,
          status: 'in_progress'
        }
      },
      { new: true }
    );

    if (!visit) {
      res.status(404).json({ success: false, message: 'Field visit not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Field visit started. Check-in coordinates recorded.',
      data: visit
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Complete Visit (Check-Out)
export const completeVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      checklist,
      measurements,
      observations,
      farmerPresent = true,
      farmerSignatureUrl,
      farmerNotes,
      evidenceIds,
      checkOutLocation
    } = req.body;

    const updateData: any = {
      completedAt: new Date(),
      status: 'completed',
      farmerPresent
    };

    if (checklist) updateData.checklist = checklist;
    if (measurements) updateData.measurements = measurements;
    if (observations) updateData.observations = observations.trim();
    if (farmerSignatureUrl) updateData.farmerSignatureUrl = farmerSignatureUrl;
    if (farmerNotes) updateData.farmerNotes = farmerNotes.trim();
    if (evidenceIds) updateData.evidenceIds = evidenceIds;
    if (checkOutLocation) updateData.checkOutLocation = checkOutLocation;

    const visit = await FieldVisit.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!visit) {
      res.status(404).json({ success: false, message: 'Field visit not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Field visit completed and inspection report submitted successfully.',
      data: visit
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Reschedule Visit
export const rescheduleVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { scheduledDate, notes } = req.body;

    const visit = await FieldVisit.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          scheduledDate: new Date(scheduledDate),
          status: 'rescheduled',
          notes: notes ? notes.trim() : undefined
        }
      },
      { new: true }
    );

    if (!visit) {
      res.status(404).json({ success: false, message: 'Field visit not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Field visit rescheduled successfully.',
      data: visit
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Cancel Visit
export const cancelVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;

    const visit = await FieldVisit.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'cancelled',
          cancellationReason: reason.trim()
        }
      },
      { new: true }
    );

    if (!visit) {
      res.status(404).json({ success: false, message: 'Field visit not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Field visit cancelled.',
      data: visit
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Sync Offline Visit (Mobile App Idempotent Sync)
export const syncOfflineVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      visitId,
      idempotencyKey,
      checklist,
      measurements,
      observations,
      farmerPresent = true,
      farmerSignatureUrl,
      farmerNotes,
      evidenceIds,
      checkInLocation,
      checkOutLocation,
      startedAt,
      completedAt
    } = req.body;

    // Check for duplicate sync attempt
    const existing = await FieldVisit.findOne({ idempotencyKey });
    if (existing) {
      res.status(200).json({
        success: true,
        message: 'Visit was previously synchronized.',
        data: existing
      });
      return;
    }

    const visit = await FieldVisit.findByIdAndUpdate(
      visitId,
      {
        $set: {
          idempotencyKey,
          offlineSyncTimestamp: new Date(),
          startedAt: startedAt ? new Date(startedAt) : undefined,
          completedAt: completedAt ? new Date(completedAt) : new Date(),
          checkInLocation,
          checkOutLocation,
          checklist,
          measurements,
          observations,
          farmerPresent,
          farmerSignatureUrl,
          farmerNotes,
          evidenceIds,
          status: 'completed'
        }
      },
      { new: true }
    );

    if (!visit) {
      res.status(404).json({ success: false, message: 'Field visit record not found for sync.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Offline field visit data synchronized successfully.',
      data: visit
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Aggregate Field Visit Statistics
export const getVisitStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const matchQuery: any = {};

    if (projectId && projectId !== 'all') {
      matchQuery.projectId = new mongoose.Types.ObjectId(projectId);
    }

    const [statusStats, typeStats, total] = await Promise.all([
      FieldVisit.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      FieldVisit.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$visitType', count: { $sum: 1 } } }
      ]),
      FieldVisit.countDocuments(matchQuery)
    ]);

    res.status(200).json({
      success: true,
      total,
      byStatus: statusStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      byType: typeStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {})
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

