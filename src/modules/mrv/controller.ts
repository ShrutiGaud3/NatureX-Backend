import { Response } from 'express';
import { MrvRecord } from './model';
import { AuthRequest } from '../auth/middleware';

export const createMrvRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, monitoringCycleNumber = 1, baselineValue, measuredValue, methodologyUsed, evidenceCount } = req.body;
    const impactDelta = measuredValue - baselineValue;

    const record = await MrvRecord.create({
      projectId,
      monitoringCycleNumber,
      baselineValue,
      measuredValue,
      impactDelta,
      methodologyUsed,
      evidenceCount,
      status: 'submitted'
    });

    res.status(201).json({ success: true, message: 'MRV record submitted', data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectMrvHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const records = await MrvRecord.find({ projectId: req.params.projectId }).sort({ monitoringCycleNumber: 1 });
    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewMrvRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, reviewerNotes } = req.body;
    const updateData: any = { status, reviewerNotes };
    if (status === 'pass') updateData.verifiedAt = new Date();

    const record = await MrvRecord.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    res.status(200).json({ success: true, message: `MRV record updated to ${status}`, data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
