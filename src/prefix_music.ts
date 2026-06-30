import { Message } from 'discord.js';
import { PrefixCommand, BotClient } from './types';
import { getOrCreatePlayer } from './music';
import { createNowPlayingEmbed, createQueueEmbed, createErrorEmbed, createSuccessEmbed } from './embeds';
import { getVoiceChannel, getLang } from './helpers';
import { t } from './i18n';

export const prefixPlay: PrefixCommand = {
  name: 'play',
  aliases: ['شغل', 'p'],
  async execute(message: Message, args: string[], client: BotClient) {
    const lang = getLang(message.guildId!, client);
    const voiceChannel = getVoiceChannel(message.member);
    if (!voiceChannel) return message.reply({ embeds: [createErrorEmbed(t('messages.no_voice', lang))] });

    const query = args.join(' ');
    if (!query) return message.reply({ embeds: [createErrorEmbed('❌ اكتب اسم أغنية أو رابط')] });

    try {
      const player = await getOrCreatePlayer(client.kazagumo, message.guildId!, voiceChannel.id, message.channelId);
      const result = await client.kazagumo.search(query, { requester: message.author.tag });

      if (!result.tracks.length) return message.reply({ embeds: [createErrorEmbed('❌ لا نتائج')] });

      if (result.type === 'PLAYLIST') {
        for (const track of result.tracks) player.queue.add(track);
        await message.reply({ embeds: [createSuccessEmbed(`➕ أضفت playlist: **${result.playlistName}**`)] });
      } else {
        player.queue.add(result.tracks[0]);
        await message.reply({ embeds: [createSuccessEmbed(t('messages.added_queue', lang, { title: result.tracks[0].title }))] });
      }

      if (!player.playing && !player.paused) await player.play();
    } catch (err) {
      await message.reply({ embeds: [createErrorEmbed(`Error: ${err}`)] });
    }
  },
};

export const prefixPause: PrefixCommand = {
  name: 'pause',
  aliases: ['توقف'],
  async execute(message: Message, args: string[], client: BotClient) {
    const lang = getLang(message.guildId!, client);
    const player = client.kazagumo.players.get(message.guildId!);
    if (!player) return message.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))] });
    player.pause(true);
    await message.reply({ embeds: [createSuccessEmbed(t('messages.paused', lang))] });
  },
};

export const prefixResume: PrefixCommand = {
  name: 'resume',
  aliases: ['استأنف', 'استئناف'],
  async execute(message: Message, args: string[], client: BotClient) {
    const lang = getLang(message.guildId!, client);
    const player = client.kazagumo.players.get(message.guildId!);
    if (!player) return message.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))] });
    player.pause(false);
    await message.reply({ embeds: [createSuccessEmbed(t('messages.resumed', lang))] });
  },
};

export const prefixSkip: PrefixCommand = {
  name: 'skip',
  aliases: ['تخطى', 'تخطي'],
  async execute(message: Message, args: string[], client: BotClient) {
    const lang = getLang(message.guildId!, client);
    const player = client.kazagumo.players.get(message.guildId!);
    if (!player) return message.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))] });
    await player.skip();
    await message.reply({ embeds: [createSuccessEmbed(t('messages.skipped', lang))] });
  },
};

export const prefixStop: PrefixCommand = {
  name: 'stop',
  aliases: ['أوقف', 'وقف'],
  async execute(message: Message, args: string[], client: BotClient) {
    const lang = getLang(message.guildId!, client);
    const player = client.kazagumo.players.get(message.guildId!);
    if (!player) return message.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))] });
    player.destroy();
    await message.reply({ embeds: [createSuccessEmbed(t('messages.stopped', lang))] });
  },
};

export const prefixVolume: PrefixCommand = {
  name: 'volume',
  aliases: ['صوت', 'vol'],
  async execute(message: Message, args: string[], client: BotClient) {
    const lang = getLang(message.guildId!, client);
    const player = client.kazagumo.players.get(message.guildId!);
    if (!player) return message.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))] });
    const level = parseInt(args[0]);
    if (isNaN(level) || level < 0 || level > 100) {
      return message.reply({ embeds: [createErrorEmbed('❌ اكتب رقم بين 0 و 100')] });
    }
    await player.setVolume(level);
    await message.reply({ embeds: [createSuccessEmbed(t('messages.volume_set', lang, { volume: level }))] });
  },
};

export const prefixLoop: PrefixCommand = {
  name: 'loop',
  aliases: ['كرر', 'تكرار'],
  async execute(message: Message, args: string[], client: BotClient) {
    const lang = getLang(message.guildId!, client);
    const player = client.kazagumo.players.get(message.guildId!);
    if (!player) return message.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))] });
    const loop = player.loop === 'track' ? 'none' : 'track';
    player.setLoop(loop as any);
    const msg = loop === 'track' ? t('messages.loop_on', lang) : t('messages.loop_off', lang);
    await message.reply({ embeds: [createSuccessEmbed(msg)] });
  },
};

export const prefixShuffle: PrefixCommand = {
  name: 'shuffle',
  aliases: ['اخلط', 'خلط'],
  async execute(message: Message, args: string[], client: BotClient) {
    const lang = getLang(message.guildId!, client);
    const player = client.kazagumo.players.get(message.guildId!);
    if (!player) return message.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))] });
    player.queue.shuffle();
    await message.reply({ embeds: [createSuccessEmbed(t('messages.shuffled', lang))] });
  },
};

export const prefixQueue: PrefixCommand = {
  name: 'queue',
  aliases: ['قائمة', 'q'],
  async execute(message: Message, args: string[], client: BotClient) {
    const lang = getLang(message.guildId!, client);
    const player = client.kazagumo.players.get(message.guildId!);
    if (!player) return message.reply({ embeds: [createErrorEmbed(t('messages.queue_empty', lang))] });
    const embed = createQueueEmbed([...player.queue], player.queue.current || null);
    await message.reply({ embeds: [embed] });
  },
};

export const prefixNow: PrefixCommand = {
  name: 'now',
  aliases: ['الحالي', 'np'],
  async execute(message: Message, args: string[], client: BotClient) {
    const lang = getLang(message.guildId!, client);
    const player = client.kazagumo.players.get(message.guildId!);
    if (!player?.queue.current) {
      return message.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))] });
    }
    const embed = createNowPlayingEmbed(player.queue.current, player.shoukaku?.position || 0);
    await message.reply({ embeds: [embed] });
  },
};
