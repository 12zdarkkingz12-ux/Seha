import { Kazagumo, KazagumoPlayer, Payload } from 'kazagumo';
import { Connectors, NodeOption } from 'shoukaku';
import { Client } from 'discord.js';
import { config } from './config';
import { logger } from './logger';

const nodes: NodeOption[] = [
  {
    name: 'seha-node',
    url: `${config.lavalink.host}:${config.lavalink.port}`,
    auth: config.lavalink.password,
    secure: config.lavalink.secure,
  },
];

export function createKazagumo(client: Client): Kazagumo {
  const kazagumo = new Kazagumo(
    {
      defaultSearchEngine: 'youtube',
      send: (guildId: string, payload: Payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
      },
    },
    new Connectors.DiscordJS(client),
    nodes,
    {
      moveOnDisconnect: false,
      resume: false,
      resumeTimeout: 30,
      reconnectTries: 2,
      restTimeout: 10000,
    }
  );

  kazagumo.shoukaku.on('ready', (name) => logger.info(`✅ Lavalink node ready: ${name}`));
  kazagumo.shoukaku.on('error', (name, error) => logger.error(`❌ Node error [${name}]: ${error.message}`));
  kazagumo.shoukaku.on('close', (name, code, reason) => logger.warn(`⚠️ Node closed [${name}]: ${code} ${reason}`));
  kazagumo.shoukaku.on('disconnect', (name) => logger.warn(`⚠️ Node disconnected [${name}]`));

  kazagumo.on('playerStart', (player, track) => {
    logger.info(`🎵 Now playing: ${track.title} in guild ${player.guildId}`);
  });

  kazagumo.on('playerEnd', (player) => {
    logger.info(`⏹️ Track ended in guild ${player.guildId}`);
  });

  kazagumo.on('playerEmpty', (player) => {
    logger.info(`📭 Queue empty in guild ${player.guildId}`);
    setTimeout(() => {
      if (!player.playing && !player.paused) player.destroy();
    }, 30000);
  });

  kazagumo.on('playerClosed', (player) => {
    logger.info(`🔴 Player closed in guild ${player.guildId}`);
  });

  return kazagumo;
}

export async function getOrCreatePlayer(
  kazagumo: Kazagumo,
  guildId: string,
  voiceChannelId: string,
  textChannelId: string
): Promise<KazagumoPlayer> {
  let player = kazagumo.players.get(guildId);

  if (!player) {
    player = await kazagumo.createPlayer({
      guildId,
      voiceId: voiceChannelId,
      textId: textChannelId,
      deaf: true,
      volume: config.defaultVolume,
    });
  }

  return player;
}
