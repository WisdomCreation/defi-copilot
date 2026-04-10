import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { get1inchQuote } from '../services/trading';

const QuoteBodySchema = z.object({
  tokenIn: z.string().min(1),
  tokenOut: z.string().min(1),
  amountIn: z.string().min(1),
  chain: z.enum(['ethereum', 'base', 'arbitrum', 'polygon', 'solana']),
  slippage: z.number().min(0).max(50).optional(),
  fromAddress: z.string().optional(),
});

export const quoteRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: z.infer<typeof QuoteBodySchema> }>(
    '/quote',
    async (req, reply) => {
      const parsed = QuoteBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const quote = await get1inchQuote(parsed.data);

      if (!quote) {
        return reply.status(500).send({ error: 'Failed to fetch quote' });
      }

      return reply.send(quote);
    }
  );
};
