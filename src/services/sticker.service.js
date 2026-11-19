import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { addExif } from '../utils/exif.js';
import { config } from '../config/index.js';

const execFileAsync = promisify(execFile);

/**
 * Convierte un buffer de imagen en un sticker WebP estático (512x512 con bordes transparentes).
 * @param {Buffer} inputBuffer 
 * @param {object} [options] 
 * @returns {Promise<Buffer>}
 */
export async function convertImageToSticker(inputBuffer, options = {}) {
  const packName = options.packName || config.stickerPackName;
  const author = options.author || config.stickerAuthor;

  const webpBuffer = await sharp(inputBuffer)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .webp({ quality: 80 })
    .toBuffer();

  return await addExif(webpBuffer, packName, author);
}

/**
 * Ejecuta ffmpeg con los argumentos dados.
 */
async function runFfmpeg(args) {
  try {
    return await execFileAsync('ffmpeg', args);
  } catch (err) {
    throw new Error(`Error al procesar video con FFmpeg: ${err.stderr || err.message}`);
  }
}

/**
 * Convierte un buffer de video o GIF en un sticker WebP animado (512x512, máx 8s, <500KB).
 * @param {Buffer} inputBuffer 
 * @param {object} [options] 
 * @returns {Promise<Buffer>}
 */
export async function convertVideoToSticker(inputBuffer, options = {}) {
  const packName = options.packName || config.stickerPackName;
  const author = options.author || config.stickerAuthor;
  const maxDuration = options.maxDuration || config.maxVideoDurationSeconds;

  const tempId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const inputPath = path.join(config.tempDir, `${tempId}_in.mp4`);
  const outputPath = path.join(config.tempDir, `${tempId}_out.webp`);
  const compressedPath = path.join(config.tempDir, `${tempId}_comp.webp`);

  try {
    await fs.writeFile(inputPath, inputBuffer);

    // Pase 1: Conversión estándar a 15 fps y calidad 40
    const filter = 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(512-iw)/2:(512-ih)/2:color=#00000000,fps=15';
    await runFfmpeg([
      '-y',
      '-i', inputPath,
      '-t', String(maxDuration),
      '-vf', filter,
      '-c:v', 'libwebp',
      '-lossless', '0',
      '-compression_level', '4',
      '-q:v', '40',
      '-loop', '0',
      '-an',
      outputPath
    ]);

    let finalFilePath = outputPath;
    let stat = await fs.stat(finalFilePath);

    // Si excede 500 KB (límite de WhatsApp para stickers animados), segundo pase de compresión
    if (stat.size > 500 * 1024) {
      const lowerFilter = 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(512-iw)/2:(512-ih)/2:color=#00000000,fps=12';
      await runFfmpeg([
        '-y',
        '-i', inputPath,
        '-t', String(maxDuration),
        '-vf', lowerFilter,
        '-c:v', 'libwebp',
        '-lossless', '0',
        '-compression_level', '6',
        '-q:v', '25',
        '-loop', '0',
        '-an',
        compressedPath
      ]);
      finalFilePath = compressedPath;
    }

    const webpBuffer = await fs.readFile(finalFilePath);
    return await addExif(webpBuffer, packName, author);
  } finally {
    // Limpieza de archivos temporales
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
    await fs.unlink(compressedPath).catch(() => {});
  }
}
