import { Response } from 'express';
import { ReviewFinding } from './model';
import { AuthRequest } from '../auth/middleware';

export const createFinding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, entityType, entityId, title, description } = req.body;
    const finding = await ReviewFinding.create({
      projectId,
      entityType,
      entityId,
      raisedBy: req.user?.id,
      title,
      description,
      status: 'open'
    });
    res.status(201).json({ success: true, message: 'Review finding created', data: finding });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFindingsByProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const findings = await ReviewFinding.find({ projectId: req.params.projectId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: findings.length, data: findings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const respondToFinding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { responseNotes } = req.body;
    const finding = await ReviewFinding.findByIdAndUpdate(
      req.params.id,
      { $set: { responseNotes, status: 'responded' } },
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Response submitted', data: finding });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resolveFinding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const finding = await ReviewFinding.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'resolved', resolvedAt: new Date() } },
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Finding marked as resolved', data: finding });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
