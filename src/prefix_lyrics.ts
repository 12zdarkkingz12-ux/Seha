import { Message } from 'discord.js';
import { PrefixCommand, BotClient } from './types';
import { fetchLyrics, getCurrentLineIndex } from './lyrics';
import { translateToArabic } from './translate';
import { createLyricsEmbed, createErrorEmbed } from './embeds';
import { getLang } from './helpers';
import { t } from './i18n';

export const prefixLyrics: PrefixCommand = {
  name: 'lyrics',
  aliases: ['كلمات'],
  async execute(message: Message, args: string[], client: BotClient) {
    const lang = getLang(message.guildId!, client);
    const player = client.kazagumo.players.get(message.guildId!);

    let query = args.join(' ');
    if (!query && player?.queue.current) {
      query = `${player.queue.current.title} ${player.queue.current.author || ''}`;
    }

    if (!query) return message.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))] });

    const result = await fetchLyrics(query);
    if (!result) return message.reply({ embeds: [createErrorEmbed(t('messages.lyrics_not_found', lang))] });

    let currentLine = -1;
    if (result.synced && player?.shoukakuPlayer?.position) {
      currentLine = getCurrentLineIndex(result.synced, player.shoukakuPlayer.position);
    }

    const embed = createLyricsEmbed(result.title, result.artist, result.lyrics, currentLine);
    await message.reply({ embeds: [embed] });
  },
};

export const prefixTranslate: PrefixCommand = {
  name: 'translate',
  aliases: ['ترجم', 'ترجمة'],
  async execute(message: Message, args: string[], client: BotClient) {
    const lang = getLang(message.guildId!, client);
    const player = client.kazagumo.players.get(message.guildId!);

    let query = args.join(' ');
    if (!query && player?.queue.current) {
      query = `${player.queue.current.title} ${player.queue.current.author || ''}`;
    }

    if (!query) return message.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))] });

    const result = await fetchLyrics(query);
    if (!result) return message.reply({ embeds: [createErrorEmbed(t('messages.lyrics_not_found', lang))] });

    const translated = await translateToArabic(result.lyrics);
    if (!translated) return message.reply({ embeds: [createErrorEmbed('❌ فشل في الترجمة')] });

    const embed = createLyricsEmbed(result.title, result.artist, translated, -1, true);
    await message.reply({ embeds: [embed] });
  },
};
