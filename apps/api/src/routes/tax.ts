import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { handleTaxReport, handleCapitalGains, handleExportCSV, handleTaxLossHarvesting, handleProofOfFunds, handleOFACCheck } from '../services/taxHandlers';

const TaxQuerySchema = z.object({ walletAddress: z.string(), year: z.number().optional() });

const taxRoutes: FastifyPluginAsync = async (fastify) => {

  fastify.get('/api/tax/report', async (request, reply) => {
    const { walletAddress, year } = request.query as any;
    if (!walletAddress) return reply.code(400).send({ error: 'walletAddress required' });
    const result = await handleTaxReport(walletAddress, year ? parseInt(year) : undefined);
    return reply.send(result);
  });

  fastify.get('/api/tax/gains', async (request, reply) => {
    const { walletAddress } = request.query as any;
    if (!walletAddress) return reply.code(400).send({ error: 'walletAddress required' });
    const result = await handleCapitalGains(walletAddress);
    return reply.send(result);
  });

  fastify.get('/api/tax/export-csv', async (request, reply) => {
    const { walletAddress } = request.query as any;
    if (!walletAddress) return reply.code(400).send({ error: 'walletAddress required' });
    const result = await handleExportCSV(walletAddress);
    if (result.csv) {
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="defi-trades-${walletAddress.slice(0,6)}.csv"`);
      return reply.send(result.csv);
    }
    return reply.send(result);
  });

  fastify.get('/api/tax/harvest', async (request, reply) => {
    const { walletAddress } = request.query as any;
    if (!walletAddress) return reply.code(400).send({ error: 'walletAddress required' });
    const result = await handleTaxLossHarvesting(walletAddress);
    return reply.send(result);
  });

  fastify.get('/api/tax/proof-of-funds', async (request, reply) => {
    const { walletAddress } = request.query as any;
    if (!walletAddress) return reply.code(400).send({ error: 'walletAddress required' });
    const result = await handleProofOfFunds(walletAddress);
    return reply.send(result);
  });

  fastify.get('/api/tax/ofac', async (request, reply) => {
    const { walletAddress } = request.query as any;
    if (!walletAddress) return reply.code(400).send({ error: 'walletAddress required' });
    const result = await handleOFACCheck(walletAddress);
    return reply.send(result);
  });
};

export default taxRoutes;
