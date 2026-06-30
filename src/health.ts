import http from 'http';
import { logger } from './logger';

export function startHealthServer(): void {
  const port = Number(process.env.PORT) || 3000;

  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', bot: 'Seha', uptime: process.uptime() }));
  });

  server.listen(port, () => {
    logger.info(`🌐 Health server listening on port ${port}`);
  });
}
