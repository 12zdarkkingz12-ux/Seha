import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { SlashCommand, BotClient } from './types';
import { getOrCreatePlayer } from './music';
import { createNowPlayingEmbed, createQueueEmbed, createErrorEmbed, createSuccessEmbed } from './embeds';
import { getLang } from './helpers';
import { t } from './i18n';

export const playCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song')
    .addStringOption(o => o.setName('query').setDescription('Song name or URL').setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    await interaction.deferReply();
    const lang = getLang(interaction.guildId!, client);
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice?.channel;

    if (!voiceChannel) {
      return interaction.editReply({ embeds: [createErrorEmbed(t('messages.no_voice', lang))] });
    }

    const query = interaction.options.getString('query', true);

    try {
      const player = await getOrCreatePlayer(
        client.kazagumo,
        interaction.guildId!,
        voiceChannel.id,
        interaction.channelId
      );

      const result = await client.kazagumo.search(query, {
        requester: { id: interaction.user.id, tag: interaction.user.tag },
      });

      if (!result.tracks.length) {
        return interaction.editReply({ embeds: [createErrorEmbed('❌ No results found')] });
      }

      if (result.type === 'PLAYLIST') {
        for (const track of result.tracks) player.queue.add(track);
        await interaction.editReply({
          embeds: [createSuccessEmbed(`➕ Added playlist: **${result.playlistName}** (${result.tracks.length} tracks)`)],
        });
      } else {
        player.queue.add(result.tracks[0]);
        await interaction.editReply({
          embeds: [createSuccessEmbed(t('messages.added_queue', lang, { title: result.tracks[0].title }))],
        });
      }

      if (!player.playing && !player.paused) await player.play();
    } catch (err) {
      await interaction.editReply({ embeds: [createErrorEmbed(`Error: ${err}`)] });
    }
  },
};

export const pauseCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pause the current song'),
  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const lang = getLang(interaction.guildId!, client);
    const player = client.kazagumo.players.get(interaction.guildId!);
    if (!player) return interaction.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))], ephemeral: true });
    player.pause(true);
    return interaction.reply({ embeds: [createSuccessEmbed(t('messages.paused', lang))] });
  },
};

export const resumeCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('resume').setDescription('Resume the current song'),
  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const lang = getLang(interaction.guildId!, client);
    const player = client.kazagumo.players.get(interaction.guildId!);
    if (!player) return interaction.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))], ephemeral: true });
    player.pause(false);
    return interaction.reply({ embeds: [createSuccessEmbed(t('messages.resumed', lang))] });
  },
};

export const skipCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current song'),
  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const lang = getLang(interaction.guildId!, client);
    const player = client.kazagumo.players.get(interaction.guildId!);
    if (!player) return interaction.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))], ephemeral: true });
    await player.skip();
    return interaction.reply({ embeds: [createSuccessEmbed(t('messages.skipped', lang))] });
  },
};

export const stopCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Stop the bot'),
  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const lang = getLang(interaction.guildId!, client);
    const player = client.kazagumo.players.get(interaction.guildId!);
    if (!player) return interaction.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))], ephemeral: true });
    player.destroy();
    return interaction.reply({ embeds: [createSuccessEmbed(t('messages.stopped', lang))] });
  },
};

export const volumeCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Change volume')
    .addIntegerOption(o => o.setName('level').setDescription('0-100').setMinValue(0).setMaxValue(100).setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const lang = getLang(interaction.guildId!, client);
    const player = client.kazagumo.players.get(interaction.guildId!);
    if (!player) return interaction.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))], ephemeral: true });
    const level = interaction.options.getInteger('level', true);
    await player.setVolume(level);
    return interaction.reply({ embeds: [createSuccessEmbed(t('messages.volume_set', lang, { volume: level }))] });
  },
};

export const loopCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('loop').setDescription('Toggle loop'),
  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const lang = getLang(interaction.guildId!, client);
    const player = client.kazagumo.players.get(interaction.guildId!);
    if (!player) return interaction.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))], ephemeral: true });
    const loop = player.loop === 'track' ? 'none' : 'track';
    player.setLoop(loop as any);
    const msg = loop === 'track' ? t('messages.loop_on', lang) : t('messages.loop_off', lang);
    return interaction.reply({ embeds: [createSuccessEmbed(msg)] });
  },
};

export const shuffleCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle queue'),
  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const lang = getLang(interaction.guildId!, client);
    const player = client.kazagumo.players.get(interaction.guildId!);
    if (!player) return interaction.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))], ephemeral: true });
    player.queue.shuffle();
    return interaction.reply({ embeds: [createSuccessEmbed(t('messages.shuffled', lang))] });
  },
};

export const queueCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Show queue'),
  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const lang = getLang(interaction.guildId!, client);
    const player = client.kazagumo.players.get(interaction.guildId!);
    if (!player) return interaction.reply({ embeds: [createErrorEmbed(t('messages.queue_empty', lang))], ephemeral: true });
    const embed = createQueueEmbed([...player.queue], player.queue.current || null);
    return interaction.reply({ embeds: [embed] });
  },
};

export const nowCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('now').setDescription('Show current song'),
  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const lang = getLang(interaction.guildId!, client);
    const player = client.kazagumo.players.get(interaction.guildId!);
    if (!player?.queue.current) {
      return interaction.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))], ephemeral: true });
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('pause_resume').setEmoji('⏸️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('loop').setEmoji('🔁').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary)
    );

    const position = player.shoukaku?.position || 0;
    const embed = createNowPlayingEmbed(player.queue.current, position);
    return interaction.reply({ embeds: [embed], components: [row] });
  },
};
