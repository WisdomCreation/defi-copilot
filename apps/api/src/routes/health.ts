import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async (_req, reply) => {
    return reply.send({
      status: 'ok',
      service: 'defi-copilot-api',
      timestamp: new Date().toISOString(),
    });
  });
};
