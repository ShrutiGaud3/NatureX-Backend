import multer from 'multer';
import { Request } from 'express';

// Use memoryStorage to hold uploaded files in Buffer without writing to local filesystem
const storage = multer.memoryStorage();

// Allowed MIME types: images and documents/PDFs
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  // Documents & PDFs
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
];

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: [${file.mimetype}]. Allowed types are Images (JPEG, PNG, WEBP, SVG) and Documents (PDF, DOC, DOCX, CSV).`
      )
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max file size
  },
  fileFilter,
});
