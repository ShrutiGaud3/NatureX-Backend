import { Request, Response, NextFunction } from 'express';

export const validateEvidenceUpload = (req: Request, res: Response, next: NextFunction): void => {
  const { projectId, evidenceType, fileUrl } = req.body;
  if (!projectId || !evidenceType || !fileUrl) {
    res.status(400).json({ success: false, message: 'projectId, evidenceType, and fileUrl are required' });
    return;
  }
  if (!['photo', 'video', 'document', 'measurement', 'gps'].includes(evidenceType)) {
    res.status(400).json({ success: false, message: 'Invalid evidenceType' });
    return;
  }
  next();
};
