import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { SlashCommand, BotClient } from './types';
import { createSuccessEmbed, createErrorEmbed } from './embeds';
import { setLang, getLang } from './helpers';
import { t } from './i18n';

export const langCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('lang')
    .setDescription('Change bot language')
    .addStringOption(o =>
      o.setName('language')
        .setDescription('Language')
        .setRequired(true)
        .addChoices({ name: 'English', value: 'en' }, { name: 'العربية', value: 'ar' })
    ),
  async execute(interaction: CommandInteraction, client: BotClient) {
    const lang = (interaction.options as any).getString('language', true);
    setLang(interaction.guildId!, lang, client);
    await interaction.reply({ embeds: [createSuccessEmbed(t('messages.lang_changed', lang))] });
  },
};

export const helpCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('help').setDescription('Show all commands'),
  async execute(interaction: CommandInteraction, client: BotClient) {
    const lang = getLang(interaction.guildId!, client);
    const { EmbedBuilder } = await import('discord.js');

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎵 Seha - قائمة الأوامر')
      .addFields(
        {
          name: '🎵 الموسيقى',
          value: '`/play` `/pause` `/resume` `/skip` `/stop` `/volume` `/loop` `/shuffle` `/queue` `/now`',
        },
        {
          name: '📝 الكلمات',
          value: '`/lyrics` — اعرض كلمات الأغنية الحالية أو ابحث عن أغنية\nأضف `translate:true` للترجمة العربية',
        },
        {
          name: '⚙️ الإعدادات',
          value: '`/lang` — غيّر لغة البوت (عربي / إنجليزي)',
        },
        {
          name: '⌨️ Prefix Commands',
          value: 'تعمل بنفس الأوامر مع `!` مثل `!play` أو `!شغل`',
        }
      )
      .setFooter({ text: 'موسيقى تفهم لغتك 🎶' });

    await interaction.reply({ embeds: [embed] });
  },
};
