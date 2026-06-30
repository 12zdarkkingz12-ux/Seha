import { Client, GatewayIntentBits, Partials, Collection, ButtonInteraction } from 'discord.js';
import { BotClient } from './types';
import { config } from './config';
import { logger } from './logger';
import { createKazagumo } from './music';
import { initLyrics } from './lyrics';
import { initTranslate } from './translate';
import { initI18n } from './i18n';
import { loadCommands, registerSlashCommands } from './commands';
import { createSuccessEmbed, createErrorEmbed } from './embeds';
import { getLang } from './helpers';
import { t } from './i18n';

export async function createBot(): Promise<BotClient> {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  }) as BotClient;

  // إعداد Collections
  client.commands = new Collection();
  client.prefixCommands = new Collection();
  client.guildLanguages = new Collection();

  // تهيئة الخدمات
  await initI18n();
  initLyrics();
  initTranslate();

  // تهيئة Kazagumo بعد إنشاء الـ client
  client.kazagumo = createKazagumo(client);

  // تحميل الأوامر
  loadCommands(client);

  // حدث الاستعداد
  client.once('ready', async () => {
    logger.info(`✅ Bot ready: ${client.user?.tag}`);
    client.user?.setActivity('🎵 موسيقى تفهم لغتك', { type: 2 });
    await registerSlashCommands();
  });

  // حدث Slash Commands
  client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (err) {
        logger.error(`Slash command error: ${err}`);
        const msg = { embeds: [createErrorEmbed('❌ حدث خطأ')], ephemeral: true };
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(msg);
        } else {
          await interaction.reply(msg as any);
        }
      }
    }

    // أزرار التحكم في Now Playing
    if (interaction.isButton()) {
      const btn = interaction as ButtonInteraction;
      const player = client.kazagumo.players.get(btn.guildId!);
      const lang = getLang(btn.guildId!, client);

      if (!player) {
        return btn.reply({ embeds: [createErrorEmbed(t('messages.no_song', lang))], ephemeral: true });
      }

      await btn.deferUpdate();

      switch (btn.customId) {
        case 'pause_resume':
          player.pause(!player.paused);
          break;
        case 'skip':
          await player.skip();
          break;
        case 'stop':
          player.destroy();
          break;
        case 'loop':
          player.setLoop(player.loop === 'track' ? 'none' : 'track' as any);
          break;
        case 'shuffle':
          player.queue.shuffle();
          break;
      }
    }
  });

  // حدث Prefix Commands
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const prefix = config.prefix;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const command = client.prefixCommands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args, client);
    } catch (err) {
      logger.error(`Prefix command error: ${err}`);
      await message.reply({ embeds: [createErrorEmbed('❌ حدث خطأ')] });
    }
  });

  // raw events لـ Shoukaku
  client.on('raw', (packet) => client.kazagumo.shoukaku.emit('raw', packet));

  return client;
}
