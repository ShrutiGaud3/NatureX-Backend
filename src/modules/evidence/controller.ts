import { Response } from 'express';
import { Evidence } from './model';
import { AuthRequest } from '../auth/middleware';

export const uploadEvidence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, landId, visitId, evidenceType, fileUrl, fileHash, captureLocation, capturedAt, deviceMetadata } = req.body;

    const evidence = await Evidence.create({
      projectId,
      landId,
      visitId,
      userId: req.user?.id,
      evidenceType,
      fileUrl,
      fileHash,
      captureLocation,
      capturedAt: capturedAt || new Date(),
      deviceMetadata,
      status: 'uploaded'
    });

    res.status(201).json({ success: true, message: 'Evidence uploaded successfully', data: evidence });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEvidenceByProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const evidenceList = await Evidence.find({ projectId: req.params.projectId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: evidenceList.length, data: evidenceList });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewEvidence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, rejectionReason, correctionNote } = req.body;
    const evidence = await Evidence.findByIdAndUpdate(
      req.params.id,
      { $set: { status, rejectionReason, correctionNote } },
      { new: true }
    );
    res.status(200).json({ success: true, message: `Evidence review updated to ${status}`, data: evidence });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
