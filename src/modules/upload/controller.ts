import { Request, Response } from 'express';
import { ImageKitService } from '../../services/imagekit.service';
import { isImageKitConfigured } from '../../config/imagekit';

/**
 * Upload single image or PDF file to ImageKit
 * Expects multipart/form-data with field name "file"
 * Optional query/body params: "folder" (e.g. "/naturex/kyc"), "tags" (comma-separated), "fileName"
 */
export const uploadSingle = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isImageKitConfigured()) {
      res.status(503).json({
        success: false,
        message:
          'ImageKit is not configured on the backend. Please add IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT to your .env file.',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded. Please send a file using the form field name "file".',
      });
      return;
    }

    const folder = (req.body.folder as string) || (req.query.folder as string) || '/naturex';
    const tagInput = (req.body.tags as string) || (req.query.tags as string) || 'naturex';
    const tags = tagInput.split(',').map((t: string) => t.trim());
    const customFileName = (req.body.fileName as string) || req.file.originalname;

    const result = await ImageKitService.uploadBuffer(
      req.file.buffer,
      customFileName,
      folder,
      tags
    );

    res.status(200).json({
      success: true,
      message: 'File uploaded to ImageKit successfully.',
      data: {
        ...result,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'ImageKit upload failed.',
    });
  }
};

/**
 * Upload multiple images or PDF files to ImageKit (up to 10 files)
 * Expects multipart/form-data with field name "files"
 */
export const uploadMultiple = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isImageKitConfigured()) {
      res.status(503).json({
        success: false,
        message:
          'ImageKit is not configured on the backend. Please add IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT to your .env file.',
      });
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No files uploaded. Please send files using the form field name "files".',
      });
      return;
    }

    const folder = (req.body.folder as string) || (req.query.folder as string) || '/naturex';
    const tagInput = (req.body.tags as string) || (req.query.tags as string) || 'naturex';
    const tags = tagInput.split(',').map((t: string) => t.trim());

    const uploadPromises = files.map((file) =>
      ImageKitService.uploadBuffer(file.buffer, file.originalname, folder, tags).then((res) => ({
        ...res,
        originalName: file.originalname,
        mimeType: file.mimetype,
      }))
    );

    const results = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      message: `${results.length} files uploaded to ImageKit successfully.`,
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Multiple files upload failed.',
    });
  }
};

/**
 * Upload base64 encoded image or PDF data string
 * Body: { base64: string, fileName?: string, folder?: string, tags?: string[] | string }
 */
export const uploadBase64 = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isImageKitConfigured()) {
      res.status(503).json({
        success: false,
        message:
          'ImageKit is not configured on the backend. Please add IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT to your .env file.',
      });
      return;
    }

    const { base64, fileName, folder = '/naturex', tags = ['naturex'] } = req.body;

    if (!base64 || typeof base64 !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Base64 data string is required in request body.',
      });
      return;
    }

    const name = fileName || `upload_${Date.now()}`;
    const tagArray = Array.isArray(tags)
      ? tags
      : String(tags)
          .split(',')
          .map((t: string) => t.trim());

    const result = await ImageKitService.uploadBase64OrUrl(base64, name, folder, tagArray);

    res.status(200).json({
      success: true,
      message: 'Base64 file uploaded to ImageKit successfully.',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Base64 upload failed.',
    });
  }
};

/**
 * Delete a file from ImageKit by fileId
 */
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isImageKitConfigured()) {
      res.status(503).json({
        success: false,
        message: 'ImageKit is not configured.',
      });
      return;
    }

    const { fileId } = req.params;
    if (!fileId) {
      res.status(400).json({ success: false, message: 'fileId parameter is required.' });
      return;
    }

    await ImageKitService.deleteFile(fileId);

    res.status(200).json({
      success: true,
      message: `File ${fileId} deleted from ImageKit successfully.`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete file from ImageKit.',
    });
  }
};

/**
 * Client-side direct upload authorization parameters
 */
export const getAuthParameters = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isImageKitConfigured()) {
      res.status(503).json({
        success: false,
        message: 'ImageKit is not configured on the backend.',
      });
      return;
    }

    const auth = ImageKitService.getAuthParameters();

    res.status(200).json({
      success: true,
      data: auth,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate ImageKit auth signature.',
    });
  }
};
