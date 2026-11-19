import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const allowedGroupsRaw = process.env.ALLOWED_GROUPS || '';
const allowedGroups = allowedGroupsRaw
  .split(',')
  .map(id => id.trim())
  .filter(Boolean);

export const config = {
  allowedGroups,
  allowAllGroups: allowedGroups.length === 0 || allowedGroups.includes('*'),
  stickerPackName: process.env.STICKER_PACK_NAME || 'dcss-stickers',
  stickerAuthor: process.env.STICKER_AUTHOR || 'DCSS Bot',
  maxVideoDurationSeconds: parseInt(process.env.MAX_VIDEO_DURATION_SECONDS || '8', 10),
  tempDir: path.join(rootDir, 'temp'),
  authDir: path.join(rootDir, 'auth_info')
};
