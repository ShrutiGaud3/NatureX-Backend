import { Response } from 'express';
import { FieldVisit } from './model';
import { AuthRequest } from '../auth/middleware';

export const createVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, landId, assignedAgentId, scheduledDate, checklist } = req.body;
    const visit = await FieldVisit.create({
      projectId,
      landId,
      assignedAgentId,
      scheduledDate,
      checklist,
      status: 'assigned'
    });
    res.status(201).json({ success: true, message: 'Field visit assigned successfully', data: visit });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyVisits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query: any = req.user?.role === 'admin' ? {} : { assignedAgentId: req.user?.id };
    const visits = await FieldVisit.find(query)
      .populate('projectId', 'name projectType')
      .populate('landId', 'landName village district')
      .sort({ scheduledDate: 1 });

    res.status(200).json({ success: true, count: visits.length, data: visits });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const startVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startLocation } = req.body;
    const visit = await FieldVisit.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          startedAt: new Date(),
          startLocation,
          status: 'in_progress'
        }
      },
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Visit started', data: visit });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const syncOfflineVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { visitId, idempotencyKey, checklist, measurements, notes, completedAt } = req.body;

    // Prevent duplicate sync using idempotencyKey
    const existing = await FieldVisit.findOne({ idempotencyKey });
    if (existing) {
      res.status(200).json({ success: true, message: 'Visit already synchronized', data: existing });
      return;
    }

    const visit = await FieldVisit.findByIdAndUpdate(
      visitId,
      {
        $set: {
          checklist,
          measurements,
          notes,
          completedAt: completedAt || new Date(),
          idempotencyKey,
          status: 'completed'
        }
      },
      { new: true }
    );

    res.status(200).json({ success: true, message: 'Offline visit synchronized successfully', data: visit });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
