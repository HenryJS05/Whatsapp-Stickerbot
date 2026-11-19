import fs from 'fs';
import { config } from './config/index.js';
import { startWhatsAppBot } from './services/whatsapp.service.js';

// Asegurar que existan los directorios necesarios
if (!fs.existsSync(config.tempDir)) {
  fs.mkdirSync(config.tempDir, { recursive: true });
}
if (!fs.existsSync(config.authDir)) {
  fs.mkdirSync(config.authDir, { recursive: true });
}

console.log('🤖 Iniciando el servicio de DCSS Stickers Bot...');

// Iniciar el bot
startWhatsAppBot().catch((err) => {
  console.error('❌ Error fatal al iniciar el bot:', err);
  process.exit(1);
});

// Manejo de señales de cierre seguro
process.on('SIGINT', () => {
  console.log('\n👋 Cerrando DCSS Stickers Bot de forma segura...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Promesa no manejada:', reason);
});
