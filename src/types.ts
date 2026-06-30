import { Client, Collection, ChatInputCommandInteraction } from 'discord.js';
import { Kazagumo } from 'kazagumo';

export interface BotClient extends Client {
  kazagumo: Kazagumo;
  commands: Collection<string, SlashCommand>;
  prefixCommands: Collection<string, PrefixCommand>;
  guildLanguages: Collection<string, string>;
}

export interface SlashCommand {
  data: any;
  execute: (interaction: ChatInputCommandInteraction, client: BotClient) => Promise<any>;
}

export interface PrefixCommand {
  name: string;
  aliases?: string[];
  execute: (message: any, args: string[], client: BotClient) => Promise<any>;
}

export interface LyricsResult {
  title: string;
  artist: string;
  lyrics: string;
  synced?: SyncedLine[];
}

export interface SyncedLine {
  time: number;
  text: string;
}
