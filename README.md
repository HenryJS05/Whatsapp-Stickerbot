# Bot de Stickers para WhatsApp (`dcss-stickers`)

Convierte automáticamente imágenes, videos cortos, GIFs y enlaces de X (Twitter) enviados a grupos autorizados de WhatsApp en stickers de alta calidad (manteniendo su proporción original con fondo transparente).

---

## 🚀 Características

* 🖼️ **Imágenes y Fotos:** Se convierten en stickers estáticos WebP (512x512) conservando su forma original con bordes transparentes.
* 🎞️ **Videos y GIFs (≤ 8 segundos):** Se convierten en stickers animados optimizados (< 500 KB para cumplir con las restricciones de WhatsApp).
* 🐦 **Enlaces de X / Twitter:** Descarga automática de fotos, GIFs o videos publicados en X para convertirlos en stickers sin requerir APIs de pago.
* ⏳ **Reacciones interactivas:**
  * ⏳ *Procesando...*
  * ✅ *¡Sticker enviado!*
  * ❌ *Hubo un error (video muy largo, tweet privado o sin medios).*
* 🔒 **Filtro de grupos autorizados:** Control total sobre en qué grupos puede operar el bot.
* 💬 **Soporte para citas/respuestas:** Puedes responder a una imagen o video existente y el bot lo convertirá.

---

## 📁 Estructura del Proyecto

```text
dcss-stickers/
├── auth_info/                  # Sesión guardada de WhatsApp (generada tras escanear el QR)
├── src/
│   ├── config/
│   │   └── index.js            # Lectura de variables de entorno y configuración
│   ├── handlers/
│   │   └── messageHandler.js   # Procesamiento de mensajes, filtros y reacciones
│   ├── services/
│   │   ├── sticker.service.js  # Conversión con Sharp y FFmpeg (512x512 + bordes transparentes)
│   │   ├── twitter.service.js  # Extracción de medios de X/Twitter vía FxTwitter API
│   │   └── whatsapp.service.js # Cliente WebSocket de WhatsApp (Baileys)
│   ├── utils/
│   │   ├── exif.js             # Inyección de metadatos EXIF de WhatsApp en WebP
│   │   └── mediaDownloader.js  # Descarga de medios de WhatsApp y URLs externas
│   └── index.js                # Punto de entrada
├── temp/                       # Archivos temporales de procesamiento
├── .env                        # Configuración activa
├── .env.example                # Plantilla de configuración
├── package.json
└── README.md
```

---

## ⚙️ Requisitos Previos

1. **Node.js** v18 o superior (probado con v26).
2. **FFmpeg** instalado y accesible desde la terminal (`ffmpeg -version`).

---

## 🛠️ Configuración

1. Revisa o edita el archivo `.env`:

```env
# Deja vacío o pon "*" para permitir todos los grupos donde esté el bot.
# Para limitar a grupos específicos, añade los JIDs separados por coma:
ALLOWED_GROUPS=

# Metadatos que aparecerán al tocar el sticker en WhatsApp
STICKER_PACK_NAME="dcss-stickers"
STICKER_AUTHOR="DCSS Bot"

# Duración máxima de videos/GIFs (por defecto 8 segundos)
MAX_VIDEO_DURATION_SECONDS=8
```

> 💡 **¿Cómo saber el ID de un grupo?**
> Con el bot encendido, envía `.id` o `!id` en cualquier grupo y el bot responderá con el ID exacto (ej. `120363028392819283@g.us`). Cópialo a `ALLOWED_GROUPS`.

---

## ▶️ Ejecución

### Modo producción:
```bash
npm start
```

### Modo desarrollo (con recarga automática):
```bash
npm run dev
```

1. La primera vez que lo inicies, verás un **código QR en la terminal**.
2. Abre WhatsApp en tu teléfono:
   * **Ajustes / Configuración** > **Dispositivos vinculados** > **Vincular un dispositivo**.
   * Escanea el código QR de la terminal.
3. Las credenciales se guardarán en la carpeta `auth_info/`, por lo que **no tendrás que volver a escanearlo** en futuros reinicios.

---

## 📝 Uso en WhatsApp

En el grupo autorizado:
1. **Foto:** Envía cualquier imagen o foto directa (o responde a una con cualquier texto).
2. **Video / GIF:** Envía un video de hasta 8 segundos (o un GIF).
3. **Enlace de X / Twitter:** Envía un mensaje que contenga el enlace del tweet (ejemplo: `https://x.com/usuario/status/1234567890`).
4. Observa cómo el bot reacciona con ⏳ mientras procesa, y luego con ✅ enviando el sticker.
