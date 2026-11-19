import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import { config } from '../config/index.js';
import { handleIncomingMessage } from '../handlers/messageHandler.js';

const logger = pino({ level: 'silent' });

/**
 * Inicia la conexión de WhatsApp con Baileys.
 */
export async function startWhatsAppBot() {
  const { state, saveCreds } = await useMultiFileAuthState(config.authDir);
  const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({
    version: [2, 3000, 1015901307],
    isLatest: false
  }));

  console.log(`\n🚀 Iniciando DCSS-Stickers (WhatsApp v${version.join('.')}, isLatest: ${isLatest})...`);

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    browser: ['DCSS Stickers', 'Chrome', '1.0.0'],
    generateHighQualityLinkPreview: true
  });

  // Guardar credenciales de sesión cada vez que se actualicen
  sock.ev.on('creds.update', saveCreds);

  // Manejar el estado de la conexión
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 Escanea este código QR con WhatsApp en tu teléfono:\n');
      qrcode.generate(qr, { small: true });
      console.log('\n(Abre WhatsApp > Dispositivos vinculados > Vincular un dispositivo)\n');
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output?.statusCode
        : lastDisconnect?.error?.code;

      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(
        `⚠️ Conexión cerrada debido a: ${lastDisconnect?.error?.message || 'Desconocido'} (Código: ${statusCode}).`
      );

      if (shouldReconnect) {
        console.log('🔄 Reconectando en 3 segundos...');
        setTimeout(() => startWhatsAppBot(), 3000);
      } else {
        console.log('❌ Sesión cerrada permanentemente. Por favor, borra la carpeta auth_info y vuelve a escanear el QR.');
      }
    } else if (connection === 'open') {
      console.log('====================================================');
      console.log('✅ ¡Bot DCSS-Stickers conectado exitosamente a WhatsApp!');
      console.log(`📦 Pack de stickers: "${config.stickerPackName}"`);
      console.log(`👤 Autor: "${config.stickerAuthor}"`);
      if (config.allowAllGroups) {
        console.log('🌐 Modo: Escuchando en TODOS los grupos.');
      } else {
        console.log(`🔒 Modo: Limitado a ${config.allowedGroups.length} grupo(s) autorizado(s).`);
      }
      console.log('====================================================\n');
    }
  });

  // Escuchar mensajes entrantes (notify y append para permitir comandos desde el propio teléfono vinculado)
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const msg of messages) {
      try {
        await handleIncomingMessage(sock, msg);
      } catch (err) {
        console.error('Error no controlado al procesar mensaje:', err);
      }
    }
  });

  return sock;
}
