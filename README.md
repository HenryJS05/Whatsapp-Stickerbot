# Bot de Stickers para WhatsApp (dcss-stickers)

Convierte automáticamente fotos, videos cortos, GIFs y enlaces de X (Twitter) enviados a WhatsApp en stickers de alta calidad, conservando su proporción original con fondo transparente.

### ✨ ¿Qué hace?
* 🖼️ **Foto o imagen:** Te devuelve un sticker estático.
* 🎞️ **GIF o video corto (máx. 8 segundos):** Te devuelve un sticker animado (< 500 KB).
* 🐦 **Link de X / Twitter (foto, GIF o video):** Lo descarga y lo convierte en sticker.
* ⏳ **Reacciones automáticas:**
  * ⏳ *Procesando...*
  * ✅ *¡Sticker enviado!*
  * ❌ *Hubo un error (video muy largo, tweet privado o sin medios).*

---

## 🚀 Guía de Instalación Rápida

Sigue estos sencillos pasos para correr el bot en tu propia computadora:

### 1. Requisitos previos
* **Node.js** (versión 18 o superior): [Descargar Node.js](https://nodejs.org/)
* **FFmpeg** instalado en tu sistema:
  * **Windows:** Descarga desde [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) o con `winget install Gyan.FFmpeg`.
  * **Mac:** `brew install ffmpeg`
  * **Linux:** `sudo apt install ffmpeg`

---

### 2. Clonar e instalar dependencias

Abre tu terminal y ejecuta:

```bash
# 1. Clonar este repositorio
git clone https://github.com/TU_USUARIO/dcss-stickers.git
cd dcss-stickers

# 2. Instalar las dependencias
npm install
```

---

### 3. Configurar el archivo `.env`

Copia la plantilla de configuración:

* **En Windows (PowerShell / CMD):**
  ```powershell
  copy .env.example .env
  ```
* **En Mac / Linux:**
  ```bash
  cp .env.example .env
  ```

*(Opcional)* Abre el archivo `.env` si deseas cambiar el nombre del pack de stickers o el autor. Por defecto funcionará en cualquier grupo donde esté el bot.

---

### 4. Iniciar el bot y vincular WhatsApp

Ejecuta:

```bash
npm start
```

1. Aparecerá un **código QR** en tu terminal.
2. Abre WhatsApp en tu teléfono:
   * Ve a **Ajustes** (o los tres puntos arriba a la derecha).
   * Selecciona **Dispositivos vinculados** > **Vincular un dispositivo**.
   * Escanea el código QR que se muestra en la pantalla.
3. ¡Listo! La sesión quedará guardada en la carpeta local `auth_info/`, por lo que **no tendrás que volver a escanearlo** en futuros reinicios.

---

## 💡 Cómo usarlo en WhatsApp

* **Crear sticker:** Envía una foto, video corto (< 8s) o link de X al grupo. También puedes responder a una foto o video existente enviando cualquier mensaje o `.s`.
* **Saber el ID de un grupo:** Escribe `.id` en cualquier grupo y el bot responderá con su código identificador.
* **Limitar a grupos específicos:** Si no quieres que responda en todos lados, coloca el ID del grupo en el archivo `.env` en la variable `ALLOWED_GROUPS`:
  ```env
  ALLOWED_GROUPS="120363028392819283@g.us"
  ```
