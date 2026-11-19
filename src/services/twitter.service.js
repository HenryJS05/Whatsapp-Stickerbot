import axios from 'axios';

const TWITTER_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/i;

/**
 * Verifica si un texto contiene un enlace válido de X / Twitter.
 */
export function isTwitterUrl(text) {
  if (!text || typeof text !== 'string') return false;
  return TWITTER_REGEX.test(text);
}

/**
 * Extrae la URL de X / Twitter del texto.
 */
export function extractTwitterUrl(text) {
  if (!text) return null;
  const match = text.match(TWITTER_REGEX);
  return match ? match[0] : null;
}

/**
 * Extrae el ID del tweet desde la URL.
 */
export function getTweetId(url) {
  const match = url.match(TWITTER_REGEX);
  return match ? match[2] : null;
}

/**
 * Obtiene la información del medio (imagen, video, gif) desde la API pública de FxTwitter.
 * @param {string} twitterUrl 
 * @returns {Promise<{ type: 'image' | 'video', url: string, description?: string }>}
 */
export async function getTwitterMedia(twitterUrl) {
  const tweetId = getTweetId(twitterUrl);
  if (!tweetId) {
    throw new Error('URL de X / Twitter no válida.');
  }

  const apiUrl = `https://api.fxtwitter.com/status/${tweetId}`;

  try {
    const response = await axios.get(apiUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; dcss-stickers/1.0)'
      }
    });

    const data = response.data;

    if (!data || data.code !== 200 || !data.tweet) {
      throw new Error(data?.message || 'No se pudo obtener el tweet (puede ser privado o haber sido borrado).');
    }

    const tweet = data.tweet;

    if (!tweet.media || !tweet.media.all || tweet.media.all.length === 0) {
      throw new Error('El tweet no contiene fotos, GIFs ni videos.');
    }

    // Tomamos el primer medio adjunto
    const firstMedia = tweet.media.all[0];

    if (firstMedia.type === 'video' || firstMedia.type === 'gif') {
      const videoUrl = firstMedia.playbackUrl || firstMedia.url;
      if (!videoUrl) {
        throw new Error('No se pudo obtener el enlace de reproducción del video de X.');
      }
      return {
        type: 'video',
        url: videoUrl,
        description: tweet.text
      };
    }

    if (firstMedia.type === 'photo') {
      return {
        type: 'image',
        url: firstMedia.url,
        description: tweet.text
      };
    }

    throw new Error(`Tipo de medio no soportado: ${firstMedia.type}`);
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('El tweet no fue encontrado o la cuenta es privada.');
    }
    throw error;
  }
}
