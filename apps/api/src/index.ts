import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { healthRoutes } from './routes/health';
import { copilotRoutes } from './routes/copilot';
import { quoteRoutes } from './routes/quote';
import { ordersRoutes } from './routes/orders';
import { priceRoutes } from './routes/price';
import taxRoutes from './routes/tax';

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
  await server.register(ordersRoutes);
  await server.register(priceRoutes, { prefix: '/api' });
  await server.register(taxRoutes);

  // ─── Start Order Executor (Production Only) ───────────
  if (process.env.NODE_ENV === 'production') {
    const { getOrderExecutor } = await import('./services/orderExecutor');
    getOrderExecutor();
    console.log('🤖 Order executor started');
  }

  // ─── Start ─────────────────────────────────────────────
  const port = Number(process.env.PORT ?? 3001);
  await server.listen({ port, host: '0.0.0.0' });
  
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Orders monitoring: ${process.env.NODE_ENV === 'production' ? 'ACTIVE' : 'disabled (dev mode)'}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
