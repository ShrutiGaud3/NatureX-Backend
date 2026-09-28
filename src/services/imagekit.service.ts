import { getImageKitClient } from '../config/imagekit';

export interface ImageKitUploadResult {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  filePath: string;
  fileType: string;
  height?: number;
  width?: number;
}

export class ImageKitService {
  /**
   * Upload file buffer (e.g. from multer in-memory buffer) to ImageKit.
   * Supports both image formats (JPG, PNG, WEBP, SVG) and PDF/Document formats.
   */
  static async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    folder: string = '/naturex',
    tags: string[] = ['naturex']
  ): Promise<ImageKitUploadResult> {
    const ik = getImageKitClient();

    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const cleanFolder = folder.startsWith('/') ? folder : `/${folder}`;

    const res = await ik.upload({
      file: buffer,
      fileName: cleanFileName,
      folder: cleanFolder,
      tags,
      useUniqueFileName: true,
    });

    return {
      fileId: res.fileId,
      name: res.name,
      url: res.url,
      thumbnailUrl: res.thumbnailUrl,
      size: res.size,
      filePath: res.filePath,
      fileType: res.fileType,
      height: res.height,
      width: res.width,
    };
  }

  /**
   * Upload base64 encoded data (e.g., from mobile expo-image-picker or web canvas/reader)
   * or a remote image/PDF URL to ImageKit.
   */
  static async uploadBase64OrUrl(
    base64OrUrl: string,
    fileName: string,
    folder: string = '/naturex',
    tags: string[] = ['naturex']
  ): Promise<ImageKitUploadResult> {
    const ik = getImageKitClient();

    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const cleanFolder = folder.startsWith('/') ? folder : `/${folder}`;

    const res = await ik.upload({
      file: base64OrUrl,
      fileName: cleanFileName,
      folder: cleanFolder,
      tags,
      useUniqueFileName: true,
    });

    return {
      fileId: res.fileId,
      name: res.name,
      url: res.url,
      thumbnailUrl: res.thumbnailUrl,
      size: res.size,
      filePath: res.filePath,
      fileType: res.fileType,
      height: res.height,
      width: res.width,
    };
  }

  /**
   * Delete a file from ImageKit using its fileId.
   */
  static async deleteFile(fileId: string): Promise<void> {
    const ik = getImageKitClient();
    await ik.deleteFile(fileId);
  }

  /**
   * Generate authentication parameters for client-side direct uploads.
   */
  static getAuthParameters() {
    const ik = getImageKitClient();
    return ik.getAuthenticationParameters();
  }
}
