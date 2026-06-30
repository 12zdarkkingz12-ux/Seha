import { createBot } from './bot';
import { config } from './config';
import { logger } from './logger';

async function main() {
  logger.info('🚀 Starting Seha Bot...');

  if (!config.token) {
    logger.error('❌ DISCORD_TOKEN is missing in .env');
    process.exit(1);
  }

  if (!config.clientId) {
    logger.error('❌ CLIENT_ID is missing in .env');
    process.exit(1);
  }

  const client = await createBot();
  await client.login(config.token);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
