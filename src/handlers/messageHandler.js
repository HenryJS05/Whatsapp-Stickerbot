import { config } from '../config/index.js';
import { isTwitterUrl, extractTwitterUrl, getTwitterMedia } from '../services/twitter.service.js';
import { convertImageToSticker, convertVideoToSticker } from '../services/sticker.service.js';
import { downloadWhatsAppMedia, downloadUrlBuffer } from '../utils/mediaDownloader.js';

/**
 * Desenvuelve mensajes encapsulados (mensajes temporales, viewOnce, etc.)
 */
function unwrapMessage(msg) {
  if (!msg) return null;
  let content = msg;
  while (
    content.ephemeralMessage ||
    content.viewOnceMessage ||
    content.viewOnceMessageV2 ||
    content.documentWithCaptionMessage
  ) {
    content =
      content.ephemeralMessage?.message ||
      content.viewOnceMessage?.message ||
      content.viewOnceMessageV2?.message ||
      content.documentWithCaptionMessage?.message;
  }
  return content;
}

/**
 * Reacciona a un mensaje con un emoji.
 */
async function sendReaction(sock, jid, key, emoji) {
  try {
    await sock.sendMessage(jid, {
      react: {
        text: emoji,
        key: key
      }
    });
  } catch (err) {
    console.error('Error al enviar reacción:', err.message);
  }
}

/**
 * Extrae el texto principal de cualquier tipo de mensaje.
 */
function getMessageText(messageContent) {
  if (!messageContent) return '';

  return (
    messageContent.conversation ||
    messageContent.extendedTextMessage?.text ||
    messageContent.imageMessage?.caption ||
    messageContent.videoMessage?.caption ||
    ''
  );
}

/**
 * Procesa los mensajes entrantes de WhatsApp.
 * @param {object} sock - Instancia del socket de Baileys
 * @param {object} m - Mensaje entrante de Baileys
 */
export async function handleIncomingMessage(sock, m) {
  const jid = m.key.remoteJid;
  if (!jid) return;

  const rawMessage = m.message;
  if (!rawMessage) return;

  const messageContent = unwrapMessage(rawMessage);
  if (!messageContent) return;

  const rawText = getMessageText(messageContent).trim();

  // Evitar bucles con mensajes generados automáticamente por el bot
  if (m.key.fromMe) {
    if (messageContent.stickerMessage) return;
    if (rawText.startsWith('📌 *ID') || rawText.startsWith('❌ *Error')) return;
  }

  const isGroup = jid.endsWith('@g.us');

  // Comando de utilidad: .id, !id o /id para conocer el JID del chat/grupo
  const lowerText = rawText.toLowerCase();
  if (lowerText === '.id' || lowerText === '!id' || lowerText === '/id') {
    console.log(`📌 ID del chat solicitado: ${jid} (desde ${m.key.fromMe ? 'este dispositivo' : m.key.participant || jid})`);
    await sock.sendMessage(jid, { 
      text: `📌 *ID de este chat:*\n\`\`\`${jid}\`\`\`` 
    }, { quoted: m });
    return;
  }

  // Si no se permiten todos los grupos y es un grupo no autorizado, ignorar
  if (isGroup && !config.allowAllGroups && !config.allowedGroups.includes(jid)) {
    return;
  }

  // Detección de tipos de contenido multimedia (directos o citados/respondidos)
  const quoted = unwrapMessage(messageContent.extendedTextMessage?.contextInfo?.quotedMessage);

  const isDirectImage = Boolean(messageContent.imageMessage);
  const isDirectVideo = Boolean(messageContent.videoMessage);

  const isQuotedImage = Boolean(quoted?.imageMessage);
  const isQuotedVideo = Boolean(quoted?.videoMessage);

  const hasTwitter = isTwitterUrl(rawText);

  // Si no hay imagen, video, gif ni link de X, no procesar
  if (!isDirectImage && !isDirectVideo && !isQuotedImage && !isQuotedVideo && !hasTwitter) {
    return;
  }

  console.log(`📥 [${new Date().toLocaleTimeString()}] Procesando solicitud en ${jid} (fromMe: ${m.key.fromMe})...`);

  // 1. Reaccionar con ⏳ (Procesando)
  await sendReaction(sock, jid, m.key, '⏳');

  try {
    let stickerBuffer = null;

    // Caso 1: Enlace de X / Twitter
    if (hasTwitter) {
      const twitterUrl = extractTwitterUrl(rawText);
      console.log(`🐦 Descargando multimedia de X: ${twitterUrl}`);
      const mediaInfo = await getTwitterMedia(twitterUrl);
      const downloadedBuffer = await downloadUrlBuffer(mediaInfo.url);

      if (mediaInfo.type === 'video') {
        stickerBuffer = await convertVideoToSticker(downloadedBuffer);
      } else {
        stickerBuffer = await convertImageToSticker(downloadedBuffer);
      }
    }
    // Caso 2: Imagen directa
    else if (isDirectImage) {
      const imageBuffer = await downloadWhatsAppMedia({ key: m.key, message: messageContent });
      stickerBuffer = await convertImageToSticker(imageBuffer);
    }
    // Caso 3: Imagen citada/respondida
    else if (isQuotedImage) {
      const quotedMsgObj = {
        key: { remoteJid: jid },
        message: { imageMessage: quoted.imageMessage }
      };
      const imageBuffer = await downloadWhatsAppMedia(quotedMsgObj);
      stickerBuffer = await convertImageToSticker(imageBuffer);
    }
    // Caso 4: Video o GIF directo
    else if (isDirectVideo) {
      const seconds = messageContent.videoMessage?.seconds || 0;
      if (seconds > config.maxVideoDurationSeconds) {
        throw new Error(`El video dura ${seconds}s (máximo permitido: ${config.maxVideoDurationSeconds}s).`);
      }
      const videoBuffer = await downloadWhatsAppMedia({ key: m.key, message: messageContent });
      stickerBuffer = await convertVideoToSticker(videoBuffer);
    }
    // Caso 5: Video o GIF citado/respondido
    else if (isQuotedVideo) {
      const seconds = quoted.videoMessage?.seconds || 0;
      if (seconds > config.maxVideoDurationSeconds) {
        throw new Error(`El video citado dura ${seconds}s (máximo permitido: ${config.maxVideoDurationSeconds}s).`);
      }
      const quotedMsgObj = {
        key: { remoteJid: jid },
        message: { videoMessage: quoted.videoMessage }
      };
      const videoBuffer = await downloadWhatsAppMedia(quotedMsgObj);
      stickerBuffer = await convertVideoToSticker(videoBuffer);
    }

    // Enviar el sticker generado
    if (stickerBuffer) {
      await sock.sendMessage(jid, {
        sticker: stickerBuffer
      }, { quoted: m });

      // 2. Reaccionar con ✅ (¡Sticker enviado!)
      await sendReaction(sock, jid, m.key, '✅');
      console.log(`✅ Sticker enviado con éxito a ${jid}`);
    }
  } catch (error) {
    console.error(`❌ Error procesando sticker en ${jid}:`, error.message);

    // 3. Reaccionar con ❌ (Hubo un error)
    await sendReaction(sock, jid, m.key, '❌');

    // Mensaje de ayuda breve en caso de error
    const friendlyMessage = error.message.includes('FFmpeg')
      ? 'No se pudo procesar el formato del video.'
      : error.message;

    await sock.sendMessage(jid, {
      text: `❌ *Error:* ${friendlyMessage}`
    }, { quoted: m });
  }
}
