import dotenv from 'dotenv';
dotenv.config();

export const config = {
  token: process.env.DISCORD_TOKEN!,
  clientId: process.env.CLIENT_ID!,
  prefix: process.env.PREFIX || '!',
  lavalink: {
    host: process.env.LAVALINK_HOST || 'localhost',
    port: parseInt(process.env.LAVALINK_PORT || '2333'),
    password: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
    secure: process.env.LAVALINK_SECURE === 'true',
  },
  geniusApiKey: process.env.GENIUS_API_KEY || '',
  libretranslateUrl: process.env.LIBRETRANSLATE_URL || '',
  defaultVolume: parseInt(process.env.DEFAULT_VOLUME || '50'),
  maxPlaylistSize: parseInt(process.env.MAX_PLAYLIST_SIZE || '50'),
  defaultLang: process.env.DEFAULT_LANG || 'en',
};
