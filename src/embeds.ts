import { EmbedBuilder, ColorResolvable } from 'discord.js';
import { KazagumoTrack } from 'kazagumo';
import { SyncedLine } from './types';

const MAIN_COLOR: ColorResolvable = 0x5865F2;

export function createNowPlayingEmbed(track: KazagumoTrack, position: number = 0): EmbedBuilder {
  const duration = formatDuration(track.length || 0);
  const pos = formatDuration(position);
  const bar = createProgressBar(position, track.length || 0);

  return new EmbedBuilder()
    .setColor(MAIN_COLOR)
    .setTitle('🎵 الآن يُشغل')
    .setDescription(`**${track.title}**\n${track.author || 'Unknown'}`)
    .addFields(
      { name: 'المدة', value: `${pos} / ${duration}`, inline: true },
      { name: 'التقدم', value: bar, inline: true }
    )
    .setThumbnail(track.thumbnail || null)
    .setFooter({ text: `طلب من: ${(track.requester as { tag?: string })?.tag || 'Unknown'}` });
}

export function createQueueEmbed(tracks: KazagumoTrack[], currentTrack: KazagumoTrack | null): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(MAIN_COLOR).setTitle('📋 قائمة الانتظار');

  if (currentTrack) {
    embed.addFields({ name: '▶️ الحالي', value: `**${currentTrack.title}**` });
  }

  if (tracks.length === 0) {
    embed.setDescription('القائمة فارغة');
  } else {
    const list = tracks
      .slice(0, 10)
      .map((t, i) => `**${i + 1}.** ${t.title} — ${formatDuration(t.length || 0)}`)
      .join('\n');
    embed.setDescription(list);
    if (tracks.length > 10) {
      embed.setFooter({ text: `و ${tracks.length - 10} أغنية أخرى...` });
    }
  }

  return embed;
}

export function createLyricsEmbed(
  title: string,
  artist: string,
  lyrics: string,
  currentLineIndex: number = -1,
  translated: boolean = false
): EmbedBuilder {
  const lines = lyrics.split('\n');

  const display = lines.map((line, i) => {
    if (i === currentLineIndex) return `**> ${line}**`;
    return line;
  }).join('\n');

  return new EmbedBuilder()
    .setColor(MAIN_COLOR)
    .setTitle(`📝 ${title}`)
    .setDescription(display.slice(0, 4000))
    .setFooter({ text: `${artist}${translated ? ' | مترجم' : ''}` });
}

export function createErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder().setColor(0xFF0000).setDescription(`❌ ${message}`);
}

export function createSuccessEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder().setColor(0x00FF00).setDescription(message);
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function createProgressBar(position: number, total: number, length: number = 15): string {
  if (!total) return '─'.repeat(length);
  const filled = Math.round((position / total) * length);
  return '▓'.repeat(filled) + '░'.repeat(length - filled);
}
