import path from 'path';
import fs from 'fs/promises';
import { logger } from '../logger';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const driver = process.env.STORAGE_DRIVER ?? 'local';
const uploadsDir = process.env.LOCAL_UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');
const baseUrl = process.env.STORAGE_BASE_URL ?? '';

const s3Bucket = process.env.S3_BUCKET;
const s3Region = process.env.AWS_REGION;

let s3Client: S3Client | null = null;
if (driver === 's3') {
  if (!s3Bucket || !s3Region) {
    logger.error('[storage] S3 driver configured but S3_BUCKET or AWS_REGION missing');
  } else {
    s3Client = new S3Client({ region: s3Region });
  }
}

export async function ensureUploadsDir() {
  if (driver !== 'local') return;
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (e) {
    logger.error('[storage] Could not create uploads dir', { err: (e as Error).message });
  }
}

export function localFileUrl(filename: string) {
  if (baseUrl) return `${baseUrl.replace(/\/$/, '')}/${filename}`;
  return `/uploads/${filename}`;
}

async function uploadToS3(tempPath: string, key: string) {
  if (!s3Client || !s3Bucket) throw new Error('S3 client not configured');
  const data = await fs.readFile(tempPath);
  const cmd = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: key,
    Body: data,
  });
  await s3Client.send(cmd);

  // Prefer explicit base URL if set (e.g., CDN). Otherwise build standard S3 URL.
  if (baseUrl) return `${baseUrl.replace(/\/$/, '')}/${key}`;
  return `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${key}`;
}

export async function saveFile(srcPath: string, filename: string) {
  if (driver === 'local') {
    await ensureUploadsDir();
    const dest = path.join(uploadsDir, filename);
    try {
      await fs.rename(srcPath, dest);
      return localFileUrl(filename);
    } catch (e) {
      logger.error('[storage] saveLocalFile failed', { err: (e as Error).message });
      throw e;
    }
  }

  if (driver === 's3') {
    const key = `uploads/${filename}`;
    try {
      const url = await uploadToS3(srcPath, key);
      // remove temp file
      await fs.unlink(srcPath).catch(() => null);
      return url;
    } catch (e) {
      logger.error('[storage] uploadToS3 failed', { err: (e as Error).message });
      throw e;
    }
  }

  throw new Error(`Unknown storage driver: ${driver}`);
}

export { driver as storageDriver };
