import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { healthRoutes } from './routes/health';
import { copilotRoutes } from './routes/copilot';
import { quoteRoutes } from './routes/quote';

const server = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
});

async function start() {
  // ─── Plugins ───────────────────────────────────────────
  await server.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
  });

  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // ─── Routes ────────────────────────────────────────────
  await server.register(healthRoutes, { prefix: '/api' });
  await server.register(copilotRoutes, { prefix: '/api' });
  await server.register(quoteRoutes, { prefix: '/api' });

  // ─── Start ─────────────────────────────────────────────
  const port = Number(process.env.PORT ?? 3001);
  await server.listen({ port, host: '0.0.0.0' });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
