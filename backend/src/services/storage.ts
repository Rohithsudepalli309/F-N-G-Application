import path from 'path';
import fs from 'fs/promises';
import { logger } from '../logger';

const driver = process.env.STORAGE_DRIVER ?? 'local';
const uploadsDir = process.env.LOCAL_UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');
const baseUrl = process.env.STORAGE_BASE_URL ?? '';

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
  // If no STORAGE_BASE_URL provided, default to server-hosted /uploads/<filename>
  return `/uploads/${filename}`;
}

export async function saveLocalFile(srcPath: string, filename: string) {
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

export { driver as storageDriver };
