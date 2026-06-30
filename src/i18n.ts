import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';
import { config } from './config';

export async function initI18n(): Promise<void> {
  await i18next.use(Backend).init({
    lng: config.defaultLang,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}.json'),
    },
    interpolation: { escapeValue: false },
  });
}

export function t(key: string, lang: string = 'en', vars?: Record<string, string | number>): string {
  return i18next.t(key, { lng: lang, ...vars }) as string;
}
