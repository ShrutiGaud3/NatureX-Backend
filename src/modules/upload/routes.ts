import { Router } from 'express';
import {
  uploadSingle,
  uploadMultiple,
  uploadBase64,
  deleteFile,
  getAuthParameters,
} from './controller';
import { upload } from './middleware';

const router = Router();

/**
 * 1. POST /api/v1/upload/single
 * Upload single image or PDF using multipart/form-data with field name "file"
 */
router.post('/single', upload.single('file'), uploadSingle);

/**
 * 2. POST /api/v1/upload/multiple
 * Upload up to 10 images or PDFs using multipart/form-data with field name "files"
 */
router.post('/multiple', upload.array('files', 10), uploadMultiple);

/**
 * 3. POST /api/v1/upload/base64
 * Upload base64 encoded image or PDF data string
 */
router.post('/base64', uploadBase64);

/**
 * 4. GET /api/v1/upload/auth
 * Get authentication parameters for client-side direct uploads
 */
router.get('/auth', getAuthParameters);

/**
 * 5. DELETE /api/v1/upload/:fileId
 * Delete file from ImageKit by fileId
 */
router.delete('/:fileId', deleteFile);

export default router;
