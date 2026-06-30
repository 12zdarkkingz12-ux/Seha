import { logger } from './logger';
import { config } from './config';

export function initTranslate(): void {
  if (config.libretranslateUrl) {
    logger.info('✅ LibreTranslate initialized');
  } else {
    logger.warn('⚠️ LIBRETRANSLATE_URL missing, translation disabled');
  }
}

export async function translateToArabic(text: string): Promise<string | null> {
  if (!config.libretranslateUrl) return null;

  try {
    const res = await fetch(`${config.libretranslateUrl}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: 'ar',
        format: 'text',
      }),
    });

    if (!res.ok) {
      logger.error(`LibreTranslate error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data.translatedText || null;
  } catch (err) {
    logger.error(`Translation error: ${err}`);
    return null;
  }
}
