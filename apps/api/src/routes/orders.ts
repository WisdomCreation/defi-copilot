import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { getOrderExecutor, orderQueue } from '../services/orderExecutor';

const CreateOrderSchema = z.object({
  userWallet: z.string(),
  type: z.enum(['limit', 'stop_loss', 'take_profit', 'dca', 'bridge']),
  tokenIn: z.string(),
  tokenOut: z.string(),
  amountIn: z.string(),
  triggerPrice: z.string().optional(),
  triggerCondition: z.enum(['above', 'below']).optional(),
  chain: z.string(),
  signedTx: z.string().nullable().optional(),
  jupiterOrderKey: z.string().nullable().optional(),
  txHash: z.string().nullable().optional(),
  dcaInterval: z.enum(['daily', 'weekly', 'monthly']).optional(),
  dcaMaxExecutions: z.number().optional(),
  executeAt: z.string().optional(),
});

const CancelOrderSchema = z.object({
  orderId: z.string(),
  userWallet: z.string(),
});

export async function ordersRoutes(fastify: FastifyInstance) {
  /**
   * Create a new order
   */
  fastify.post('/api/orders', async (request, reply) => {
    try {
      console.log('📝 Creating order with data:', JSON.stringify(request.body, null, 2));
      const data = CreateOrderSchema.parse(request.body);

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { walletAddress: data.userWallet },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            walletAddress: data.userWallet,
            chain: data.chain,
          },
        });
      }

      // Create order
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          type: data.type,
          tokenIn: data.tokenIn,
          tokenOut: data.tokenOut,
          amountIn: data.amountIn,
          triggerPrice: data.triggerPrice,
          triggerCondition: data.triggerCondition,
          chain: data.chain,
          signedTx: data.signedTx,
          txHash: data.txHash,
          dcaInterval: data.dcaInterval,
          dcaMaxExecutions: data.dcaMaxExecutions,
          status: 'watching',
        },
      });

      // If time-based execution, schedule it
      if (data.executeAt) {
        const executor = getOrderExecutor();
        await executor.scheduleOrder(order.id, new Date(data.executeAt));
      }

      console.log(`✅ Order created: ${order.id} (${order.type})`);

      return reply.send({
        success: true,
        order: {
          id: order.id,
          type: order.type,
          tokenIn: order.tokenIn,
          tokenOut: order.tokenOut,
          amountIn: order.amountIn,
          triggerPrice: order.triggerPrice,
          status: order.status,
          createdAt: order.createdAt,
        },
      });
    } catch (error: any) {
      console.error('❌ Error creating order:', error);
      
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        const issues = error.issues.map((issue: any) => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        return reply.code(400).send({
          error: `Validation error: ${issues}`,
        });
      }
      
      return reply.code(400).send({
        error: error.message || 'Failed to create order',
      });
    }
  });

  /**
   * List user's orders
   */
  fastify.get('/api/orders', async (request, reply) => {
    try {
      const { userWallet, status } = request.query as {
        userWallet: string;
        status?: string;
      };

      if (!userWallet) {
        return reply.code(400).send({ error: 'userWallet required' });
      }

      const user = await prisma.user.findUnique({
        where: { walletAddress: userWallet },
      });

      if (!user) {
        return reply.send({ orders: [] });
      }

      const orders = await prisma.order.findMany({
        where: {
          userId: user.id,
          ...(status && { status }),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return reply.send({ orders });
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      return reply.code(500).send({
        error: 'Failed to fetch orders',
      });
    }
  });

  /**
   * Get order details
   */
  fastify.get('/api/orders/:orderId', async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              walletAddress: true,
            },
          },
        },
      });

      if (!order) {
        return reply.code(404).send({ error: 'Order not found' });
      }

      return reply.send({ order });
    } catch (error: any) {
      console.error('Error fetching order:', error);
      return reply.code(500).send({
        error: 'Failed to fetch order',
      });
    }
  });

  /**
   * Get unsigned Jupiter cancel transaction for an order.
   * Frontend signs it with the user's wallet, then broadcasts it,
   * then calls POST /api/orders/cancel to update our DB.
   */
  fastify.get('/api/orders/:orderId/cancel-tx', async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };
      const { userWallet } = request.query as { userWallet: string };

      if (!userWallet) {
        return reply.code(400).send({ error: 'userWallet required' });
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      if (!order) return reply.code(404).send({ error: 'Order not found' });
      if (order.user.walletAddress !== userWallet)
        return reply.code(403).send({ error: 'Unauthorized' });
      if (!order.jupiterOrderKey)
        return reply.code(400).send({ error: 'No Jupiter order key for this order' });

      const executor = getOrderExecutor();
      const tx = await executor.getCancelTransaction(order.jupiterOrderKey, userWallet);

      return reply.send({ tx }); // base64 unsigned VersionedTransaction
    } catch (error: any) {
      console.error('Error getting cancel transaction:', error);
      return reply.code(500).send({ error: error.message || 'Failed to get cancel transaction' });
    }
  });

  /**
   * Confirm cancellation after user has signed + broadcast the Jupiter cancel tx.
   */
  fastify.post('/api/orders/cancel', async (request, reply) => {
    try {
      const data = CancelOrderSchema.parse(request.body);

      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: { user: true },
      });

      if (!order) {
        return reply.code(404).send({ error: 'Order not found' });
      }

      if (order.user.walletAddress !== data.userWallet) {
        return reply.code(403).send({ error: 'Unauthorized' });
      }

      const executor = getOrderExecutor();
      await executor.cancelOrder(data.orderId);

      return reply.send({ success: true, message: 'Order cancelled' });
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      return reply.code(400).send({ error: error.message || 'Failed to cancel order' });
    }
  });

  /**
   * Get order statistics
   */
  fastify.get('/api/orders/stats', async (request, reply) => {
    try {
      const { userWallet } = request.query as { userWallet: string };

      if (!userWallet) {
        return reply.code(400).send({ error: 'userWallet required' });
      }

      const user = await prisma.user.findUnique({
        where: { walletAddress: userWallet },
      });

      if (!user) {
        return reply.send({
          stats: {
            total: 0,
            watching: 0,
            filled: 0,
            cancelled: 0,
            failed: 0,
          },
        });
      }

      const [total, watching, filled, cancelled, failed] = await Promise.all([
        prisma.order.count({ where: { userId: user.id } }),
        prisma.order.count({ where: { userId: user.id, status: 'watching' } }),
        prisma.order.count({ where: { userId: user.id, status: 'filled' } }),
        prisma.order.count({ where: { userId: user.id, status: 'cancelled' } }),
        prisma.order.count({ where: { userId: user.id, status: 'failed' } }),
      ]);

      return reply.send({
        stats: {
          total,
          watching,
          filled,
          cancelled,
          failed,
        },
      });
    } catch (error: any) {
      console.error('Error fetching order stats:', error);
      return reply.code(500).send({
        error: 'Failed to fetch order stats',
      });
    }
  });
}
