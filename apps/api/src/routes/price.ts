import { FastifyInstance } from 'fastify';
import { priceMonitor } from '../services/priceMonitor';

export async function priceRoutes(fastify: FastifyInstance) {
  /**
   * Get current price for a token
   */
  fastify.get('/price/:symbol', async (request, reply) => {
    try {
      const { symbol } = request.params as { symbol: string };
      
      const pairSymbol = `${symbol.toUpperCase()}/USD`;
      const price = await priceMonitor.getPrice(pairSymbol);

      return reply.send({
        symbol,
        price,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      console.error('Error fetching price:', error);
      return reply.code(500).send({
        error: error.message || 'Failed to fetch price',
      });
    }
  });

  /**
   * Get multiple prices at once
   */
  fastify.post('/prices', async (request, reply) => {
    try {
      const { symbols } = request.body as { symbols: string[] };

      const pairs = symbols.map((s) => `${s.toUpperCase()}/USD`);
      const prices = await priceMonitor.getPrices(pairs);

      return reply.send({
        prices,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      console.error('Error fetching prices:', error);
      return reply.code(500).send({
        error: error.message || 'Failed to fetch prices',
      });
    }
  });
}
