import { Response } from 'express';
import { LandDocument } from './model';
import { AuthRequest } from '../auth/middleware';

export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { landId, documentType, documentTitle, documentNumber, fileUrl, fileHash } = req.body;
    const doc = await LandDocument.create({
      landId,
      userId: req.user?.id,
      documentType,
      documentTitle,
      documentNumber,
      fileUrl,
      fileHash
    });

    res.status(201).json({ success: true, message: 'Document uploaded successfully', data: doc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDocumentsByLand = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const docs = await LandDocument.find({ landId: req.params.landId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: docs.length, data: docs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, rejectionReason } = req.body;
    const doc = await LandDocument.findByIdAndUpdate(
      req.params.id,
      { $set: { verificationStatus: status, rejectionReason } },
      { new: true }
    );
    res.status(200).json({ success: true, message: `Document verification status updated to ${status}`, data: doc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
