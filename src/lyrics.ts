import { Client as GeniusClient } from 'genius-lyrics';
import { config } from './config';
import { logger } from './logger';
import { LyricsResult, SyncedLine } from './types';

let geniusClient: GeniusClient | null = null;

export function initLyrics(): void {
  if (config.geniusApiKey) {
    geniusClient = new GeniusClient(config.geniusApiKey);
    logger.info('✅ Genius API initialized');
  } else {
    logger.warn('⚠️ Genius API key missing, lyrics may be limited');
  }
}

export async function fetchSyncedLyrics(query: string): Promise<SyncedLine[] | null> {
  try {
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const results: any[] = await res.json();
    if (!results.length) return null;

    const best = results.find(r => r.syncedLyrics) || results[0];
    if (!best?.syncedLyrics) return null;

    return parseSyncedLyrics(best.syncedLyrics);
  } catch (err) {
    logger.error(`lrclib error: ${err}`);
    return null;
  }
}

export async function fetchLyrics(query: string, artist?: string): Promise<LyricsResult | null> {
  try {
    // أولاً: جرب lrclib للكلمات المتزامنة
    const searchQuery = artist ? `${query} ${artist}` : query;
    const synced = await fetchSyncedLyrics(searchQuery);

    if (synced) {
      return {
        title: query,
        artist: artist || 'Unknown',
        lyrics: synced.map(l => l.text).join('\n'),
        synced,
      };
    }

    // ثانياً: جرب Genius API
    if (geniusClient) {
      const songs = await geniusClient.songs.search(query);
      if (songs.length) {
        const song = songs[0];
        const lyrics = await song.lyrics();
        return {
          title: song.title,
          artist: song.artist.name,
          lyrics: lyrics || 'Lyrics not found',
        };
      }
    }

    return null;
  } catch (err) {
    logger.error(`Lyrics fetch error: ${err}`);
    return null;
  }
}

function parseSyncedLyrics(raw: string): SyncedLine[] {
  const lines: SyncedLine[] = [];
  const regex = /\[(\d+):(\d+\.\d+)\](.*)/;

  for (const line of raw.split('\n')) {
    const match = line.match(regex);
    if (match) {
      const min = parseInt(match[1]);
      const sec = parseFloat(match[2]);
      const text = match[3].trim();
      lines.push({ time: (min * 60 + sec) * 1000, text });
    }
  }

  return lines;
}

export function getCurrentLineIndex(synced: SyncedLine[], positionMs: number): number {
  let idx = 0;
  for (let i = 0; i < synced.length; i++) {
    if (synced[i].time <= positionMs) idx = i;
    else break;
  }
  return idx;
}
