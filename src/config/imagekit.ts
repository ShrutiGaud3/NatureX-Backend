import ImageKit from 'imagekit';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Check if all required ImageKit environment variables are present and configured.
 */
export const isImageKitConfigured = (): boolean => {
  dotenv.config();
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  return Boolean(
    publicKey &&
    privateKey &&
    urlEndpoint &&
    !publicKey.includes('your_') &&
    !privateKey.includes('your_') &&
    !urlEndpoint.includes('your_')
  );
};

let imageKitInstance: ImageKit | null = null;

/**
 * Returns a singleton instance of the ImageKit SDK.
 * Throws an error if required configuration keys are missing.
 */
export const getImageKitClient = (): ImageKit => {
  if (imageKitInstance) {
    return imageKitInstance;
  }

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || '';
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || '';

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error(
      'ImageKit credentials are not configured! Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in your .env file.'
    );
  }

  imageKitInstance = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });

  return imageKitInstance;
};
