import { GuildMember, Message, CommandInteraction } from 'discord.js';
import { BotClient } from './types';

export function getVoiceChannel(member: GuildMember | null) {
  return member?.voice?.channel || null;
}

export function getLang(guildId: string, client: BotClient): string {
  return client.guildLanguages.get(guildId) || 'en';
}

export function setLang(guildId: string, lang: string, client: BotClient): void {
  client.guildLanguages.set(guildId, lang);
}

export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
