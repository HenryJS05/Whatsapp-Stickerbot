import { downloadMediaMessage } from '@whiskeysockets/baileys';
import pino from 'pino';
import axios from 'axios';

const silentLogger = pino({ level: 'silent' });

/**
 * Descarga el contenido multimedia (foto o video/gif) de un mensaje de WhatsApp.
 * @param {object} message - Mensaje de Baileys
 * @returns {Promise<Buffer>}
 */
export async function downloadWhatsAppMedia(message) {
  try {
    const buffer = await downloadMediaMessage(
      message,
      'buffer',
      {},
      {
        logger: silentLogger,
        reuploadRequest: () => Promise.resolve()
      }
    );
    return buffer;
  } catch (err) {
    throw new Error(`No se pudo descargar el archivo multimedia de WhatsApp: ${err.message}`);
  }
}

/**
 * Descarga un archivo multimedia desde una URL externa (por ejemplo, desde X/Twitter).
 * @param {string} url 
 * @returns {Promise<Buffer>}
 */
export async function downloadUrlBuffer(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    return Buffer.from(response.data);
  } catch (err) {
    throw new Error(`Error al descargar el archivo desde la URL: ${err.message}`);
  }
}
