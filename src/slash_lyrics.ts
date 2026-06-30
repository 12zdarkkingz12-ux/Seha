import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommand, BotClient } from './types';
import { fetchLyrics, getCurrentLineIndex } from './lyrics';
import { translateToArabic } from './translate';
import { createLyricsEmbed, createErrorEmbed } from './embeds';
import { getLang } from './helpers';
import { t } from './i18n';

export const lyricsCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription('Show song lyrics')
    .addStringOption(o => o.setName('song').setDescription('Song name (leave empty for current)').setRequired(false))
    .addBooleanOption(o => o.setName('translate').setDescription('Translate to Arabic').setRequired(false)),

  async execute(interaction: CommandInteraction, client: BotClient) {
    await interaction.deferReply();
    const lang = getLang(interaction.guildId!, client);

    const songOption = (interaction.options as any).getString('song');
    const doTranslate = (interaction.options as any).getBoolean('translate') || false;

    const player = client.kazagumo.players.get(interaction.guildId!);
    let query = songOption;

    if (!query && player?.queue.current) {
      query = `${player.queue.current.title} ${player.queue.current.author || ''}`;
    }

    if (!query) {
      return interaction.editReply({ embeds: [createErrorEmbed(t('messages.no_song', lang))] });
    }

    const result = await fetchLyrics(query);

    if (!result) {
      return interaction.editReply({ embeds: [createErrorEmbed(t('messages.lyrics_not_found', lang))] });
    }

    let lyricsText = result.lyrics;
    let translated = false;

    if (doTranslate) {
      const translatedText = await translateToArabic(result.lyrics);
      if (translatedText) {
        lyricsText = translatedText;
        translated = true;
      }
    }

    // إذا فيه كلمات متزامنة والبوت شغال، حدد السطر الحالي
    let currentLine = -1;
    if (result.synced && player?.shoukakuPlayer?.position) {
      currentLine = getCurrentLineIndex(result.synced, player.shoukakuPlayer.position);
    }

    const embed = createLyricsEmbed(result.title, result.artist, lyricsText, currentLine, translated);
    await interaction.editReply({ embeds: [embed] });

    // لو فيه كلمات متزامنة، ابدأ Live Lyrics
    if (result.synced && player && !doTranslate) {
      startLiveLyrics(interaction, result.synced, player, result.title, result.artist, client);
    }
  },
};

async function startLiveLyrics(interaction: any, synced: any[], player: any, title: string, artist: string, client: BotClient) {
  const interval = setInterval(async () => {
    try {
      const currentPlayer = client.kazagumo.players.get(interaction.guildId);
      if (!currentPlayer || !currentPlayer.playing) {
        clearInterval(interval);
        return;
      }

      const pos = currentPlayer.shoukakuPlayer?.position || 0;
      const lineIdx = getCurrentLineIndex(synced, pos);
      const lyricsText = synced.map((l: any) => l.text).join('\n');
      const embed = createLyricsEmbed(title, artist, lyricsText, lineIdx);

      await interaction.editReply({ embeds: [embed] });
    } catch {
      clearInterval(interval);
    }
  }, 5000);

  // أوقف بعد 10 دقائق لحماية الـ API
  setTimeout(() => clearInterval(interval), 600000);
}
