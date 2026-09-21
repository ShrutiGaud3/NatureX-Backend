import { Request, Response, NextFunction } from 'express';

export const validateDocumentUpload = (req: Request, res: Response, next: NextFunction): void => {
  const { landId, documentType, documentTitle, fileUrl } = req.body;
  if (!landId || !documentType || !documentTitle || !fileUrl) {
    res.status(400).json({ success: false, message: 'landId, documentType, documentTitle, and fileUrl are required' });
    return;
  }
  next();
};
