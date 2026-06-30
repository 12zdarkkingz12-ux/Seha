import { Message, EmbedBuilder } from 'discord.js';
import { PrefixCommand, BotClient } from './types';
import { createSuccessEmbed, createErrorEmbed } from './embeds';
import { setLang, getLang } from './helpers';
import { t } from './i18n';

export const prefixLang: PrefixCommand = {
  name: 'lang',
  aliases: ['لغة'],
  async execute(message: Message, args: string[], client: BotClient) {
    const lang = args[0]?.toLowerCase();
    if (!['en', 'ar'].includes(lang)) {
      return message.reply({ embeds: [createErrorEmbed('❌ اكتب `en` أو `ar`')] });
    }
    setLang(message.guildId!, lang, client);
    await message.reply({ embeds: [createSuccessEmbed(t('messages.lang_changed', lang))] });
  },
};

export const prefixHelp: PrefixCommand = {
  name: 'help',
  aliases: ['مساعدة'],
  async execute(message: Message, args: string[], client: BotClient) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎵 Seha - قائمة الأوامر')
      .addFields(
        { name: '🎵 الموسيقى', value: '`!play` `!pause` `!resume` `!skip` `!stop` `!volume` `!loop` `!shuffle` `!queue` `!now`' },
        { name: '📝 الكلمات', value: '`!lyrics` `!translate`' },
        { name: '⚙️ الإعدادات', value: '`!lang en` أو `!lang ar`' },
        { name: '🌐 عربي', value: '`!شغل` `!توقف` `!تخطى` `!كلمات` `!ترجم` `!لغة` إلخ...' }
      )
      .setFooter({ text: 'موسيقى تفهم لغتك 🎶' });

    await message.reply({ embeds: [embed] });
  },
};
