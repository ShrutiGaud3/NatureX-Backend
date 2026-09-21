import { Response } from 'express';
import { Land } from './model';
import { AuthRequest } from '../auth/middleware';

export const createLand = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { landName, surveyNumber, ownershipType, currentCrop, irrigationSource, village, block, district, state, areaInAcres } = req.body;
    const land = await Land.create({
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      landName,
      surveyNumber,
      ownershipType,
      currentCrop,
      irrigationSource,
      village,
      block,
      district,
      state,
      areaInAcres,
      areaInHectares: areaInAcres ? areaInAcres * 0.404686 : undefined,
      status: 'draft'
    });

    res.status(201).json({ success: true, message: 'Land created successfully', data: land });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyLands = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query: any = req.user?.role === 'admin' ? {} : { userId: req.user?.id };
    const lands = await Land.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: lands.length, data: lands });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLandById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const land = await Land.findById(req.params.id);
    if (!land) {
      res.status(404).json({ success: false, message: 'Land not found' });
      return;
    }
    res.status(200).json({ success: true, data: land });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitLand = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const land = await Land.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'submitted' } },
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Land submitted for screening', data: land });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewLand = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, reason, question } = req.body;

    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      clarify: 'clarification',
      conflict: 'conflict'
    };

    const updateData: any = {
      status: statusMap[action],
      hasConflict: action === 'conflict'
    };
    if (action === 'reject') updateData.rejectionReason = reason;
    if (action === 'clarify') updateData.clarificationReason = question;

    const land = await Land.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    res.status(200).json({ success: true, message: `Land marked as ${updateData.status}`, data: land });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
