import { REST, Routes, Collection } from 'discord.js';
import { BotClient, SlashCommand, PrefixCommand } from './types';
import { config } from './config';
import { logger } from './logger';

// Slash Commands
import { playCommand, pauseCommand, resumeCommand, skipCommand, stopCommand, volumeCommand, loopCommand, shuffleCommand, queueCommand, nowCommand } from './slash_music';
import { lyricsCommand } from './slash_lyrics';
import { langCommand, helpCommand } from './slash_settings';

// Prefix Commands
import { prefixPlay, prefixPause, prefixResume, prefixSkip, prefixStop, prefixVolume, prefixLoop, prefixShuffle, prefixQueue, prefixNow } from './prefix_music';
import { prefixLyrics, prefixTranslate } from './prefix_lyrics';
import { prefixLang, prefixHelp } from './prefix_settings';

const slashCommands: SlashCommand[] = [
  playCommand, pauseCommand, resumeCommand, skipCommand, stopCommand,
  volumeCommand, loopCommand, shuffleCommand, queueCommand, nowCommand,
  lyricsCommand, langCommand, helpCommand,
];

const prefixCommandsList: PrefixCommand[] = [
  prefixPlay, prefixPause, prefixResume, prefixSkip, prefixStop,
  prefixVolume, prefixLoop, prefixShuffle, prefixQueue, prefixNow,
  prefixLyrics, prefixTranslate, prefixLang, prefixHelp,
];

export function loadCommands(client: BotClient): void {
  client.commands = new Collection();
  client.prefixCommands = new Collection();

  for (const cmd of slashCommands) {
    client.commands.set(cmd.data.name, cmd);
  }

  for (const cmd of prefixCommandsList) {
    client.prefixCommands.set(cmd.name, cmd);
    if (cmd.aliases) {
      for (const alias of cmd.aliases) {
        client.prefixCommands.set(alias, cmd);
      }
    }
  }

  logger.info(`✅ Loaded ${slashCommands.length} slash commands`);
  logger.info(`✅ Loaded ${prefixCommandsList.length} prefix commands`);
}

export async function registerSlashCommands(): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(config.token);
  const body = slashCommands.map(cmd => cmd.data.toJSON());

  try {
    logger.info('🔄 Registering slash commands...');
    await rest.put(Routes.applicationCommands(config.clientId), { body });
    logger.info('✅ Slash commands registered');
  } catch (err) {
    logger.error(`❌ Failed to register slash commands: ${err}`);
  }
}
