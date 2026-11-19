import webpmux from 'node-webpmux';

/**
 * Añade los metadatos EXIF de WhatsApp (nombre de pack y autor) a un buffer WebP.
 * @param {Buffer} webpBuffer 
 * @param {string} packName 
 * @param {string} author 
 * @returns {Promise<Buffer>}
 */
export async function addExif(webpBuffer, packName = 'dcss-stickers', author = 'DCSS Bot') {
  const img = new webpmux.Image();
  await img.load(webpBuffer);

  const json = {
    'sticker-pack-id': `dcss-${Date.now()}`,
    'sticker-pack-name': packName,
    'sticker-pack-publisher': author,
    'emojis': ['✨']
  };

  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ]);

  const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
  const exif = Buffer.concat([exifAttr, jsonBuff]);
  exif.writeUIntLE(jsonBuff.length, 14, 4);

  img.exif = exif;
  return await img.save(null);
}
