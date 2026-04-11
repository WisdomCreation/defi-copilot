import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../db/prisma';
import { priceMonitor } from './priceMonitor';
import { Connection as SolanaConnection, VersionedTransaction, PublicKey } from '@solana/web3.js';

// Redis connection
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Create order queue
export const orderQueue = new Queue('orders', { connection });

interface OrderJob {
  orderId: string;
}

/**
 * Order Executor Service
 * Monitors pending orders and executes them when conditions are met
 */
export class OrderExecutor {
  private worker: Worker;
  private solanaConnection: SolanaConnection;

  constructor() {
    this.solanaConnection = new SolanaConnection(
      process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com'
    );

    // Create worker to process orders
    this.worker = new Worker(
      'orders',
      async (job) => {
        console.log(`🔄 Processing order: ${job.data.orderId}`);
        await this.processOrder(job.data.orderId);
      },
      {
        connection,
        concurrency: 5, // Process 5 orders concurrently
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`✅ Order completed: ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Order failed: ${job?.id}`, err);
    });

    // Start monitoring all active orders
    this.startMonitoring();
  }

  /**
   * Start monitoring all pending orders
   */
  private async startMonitoring() {
    console.log('🔍 Starting order monitoring...');

    // Check all pending orders every 10 seconds
    setInterval(async () => {
      await this.checkPendingOrders();
    }, 10000);

    // Also check immediately
    await this.checkPendingOrders();
  }

  /**
   * Check all pending orders for execution
   */
  private async checkPendingOrders() {
    try {
      const pendingOrders = await prisma.order.findMany({
        where: {
          status: 'watching',
        },
      });

      for (const order of pendingOrders) {
        await this.checkOrder(order);
      }
    } catch (error) {
      console.error('Error checking pending orders:', error);
    }
  }

  /**
   * Check if an order should be executed
   */
  private async checkOrder(order: any) {
    try {
      // Skip if no trigger price
      if (!order.triggerPrice || !order.triggerCondition) {
        return;
      }

      // CRITICAL FIX: Add grace period to prevent immediate execution
      // Don't execute orders created within last 60 seconds
      const orderAge = Date.now() - new Date(order.createdAt).getTime();
      const GRACE_PERIOD_MS = 60 * 1000; // 60 seconds
      
      if (orderAge < GRACE_PERIOD_MS) {
        console.log(`⏳ Order ${order.id} in grace period (${Math.round(orderAge / 1000)}s old), skipping check`);
        return;
      }

      // Get current price
      const symbol = `${order.tokenOut}/USD`;
      const currentPrice = await priceMonitor.getPrice(symbol);

      const targetPrice = parseFloat(order.triggerPrice);
      const shouldExecute =
        (order.triggerCondition === 'above' && currentPrice >= targetPrice) ||
        (order.triggerCondition === 'below' && currentPrice <= targetPrice);

      if (shouldExecute) {
        console.log(
          `🎯 Order ${order.id} triggered! ${symbol} ${currentPrice} ${order.triggerCondition} ${targetPrice}`
        );

        // Add to queue for execution
        await orderQueue.add('execute-order', {
          orderId: order.id,
        });
      }
    } catch (error) {
      console.error(`Error checking order ${order.id}:`, error);
    }
  }

  /**
   * Process and execute an order
   */
  private async processOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      console.error(`Order ${orderId} not found`);
      return;
    }

    if (order.status !== 'watching') {
      console.log(`Order ${orderId} is ${order.status}, skipping`);
      return;
    }

    try {
      // Execute the order based on type
      switch (order.type) {
        case 'limit':
        case 'stop_loss':
        case 'take_profit':
          await this.executeSwapOrder(order);
          break;

        case 'dca':
          await this.executeDCAOrder(order);
          break;

        case 'bridge':
          await this.executeBridgeOrder(order);
          break;

        default:
          console.error(`Unknown order type: ${order.type}`);
      }
    } catch (error) {
      console.error(`Error executing order ${orderId}:`, error);

      // Mark as failed
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'failed',
        },
      });
    }
  }

  /**
   * Execute a swap order (limit/stop-loss/take-profit)
   */
  private async executeSwapOrder(order: any) {
    console.log(`🔄 Executing swap order ${order.id}...`);

    if (!order.signedTx) {
      throw new Error('No signed transaction found');
    }

    // Deserialize the pre-signed transaction
    const txBuffer = Buffer.from(order.signedTx, 'base64');
    const transaction = VersionedTransaction.deserialize(txBuffer);

    // Broadcast to blockchain
    const signature = await this.solanaConnection.sendRawTransaction(
      transaction.serialize()
    );

    console.log(`📡 Transaction broadcasted: ${signature}`);

    // Wait for confirmation
    await this.solanaConnection.confirmTransaction(signature, 'confirmed');

    console.log(`✅ Transaction confirmed: ${signature}`);

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'filled',
        txHash: signature,
        filledAt: new Date(),
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        orderId: order.id,
        walletAddress: order.userId, // Should be wallet address
        chain: order.chain,
        txHash: signature,
        type: order.type,
        tokenIn: order.tokenIn,
        tokenOut: order.tokenOut,
        amountIn: order.amountIn,
        status: 'confirmed',
        confirmedAt: new Date(),
      },
    });

    console.log(`✅ Order ${order.id} executed successfully!`);
  }

  /**
   * Execute a DCA order
   */
  private async executeDCAOrder(order: any) {
    console.log(`🔄 Executing DCA order ${order.id}...`);

    // Check if max executions reached
    if (order.dcaMaxExecutions && order.dcaExecutions >= order.dcaMaxExecutions) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'filled' },
      });
      return;
    }

    // Execute swap
    await this.executeSwapOrder(order);

    // Increment execution count
    await prisma.order.update({
      where: { id: order.id },
      data: {
        dcaExecutions: order.dcaExecutions + 1,
        status: order.dcaExecutions + 1 >= order.dcaMaxExecutions ? 'filled' : 'watching',
      },
    });

    // Schedule next execution
    if (order.dcaExecutions + 1 < order.dcaMaxExecutions) {
      const delay = this.getDCADelay(order.dcaInterval);
      await orderQueue.add(
        'execute-order',
        { orderId: order.id },
        { delay }
      );
    }
  }

  /**
   * Execute a bridge order
   */
  private async executeBridgeOrder(order: any) {
    console.log(`🌉 Bridge order execution not yet implemented`);
    // TODO: Implement LI.FI bridge integration
  }

  /**
   * Get delay in milliseconds for DCA interval
   */
  private getDCADelay(interval: string): number {
    const delays: Record<string, number> = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
    };

    return delays[interval] || delays.weekly;
  }

  /**
   * Schedule a time-based order
   */
  async scheduleOrder(orderId: string, executeAt: Date) {
    const delay = executeAt.getTime() - Date.now();

    if (delay > 0) {
      await orderQueue.add(
        'execute-order',
        { orderId },
        { delay }
      );

      console.log(`⏰ Order ${orderId} scheduled for ${executeAt.toISOString()}`);
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    console.log(`❌ Order ${orderId} cancelled`);
  }
}

// Singleton instance
let executorInstance: OrderExecutor | null = null;

export function getOrderExecutor(): OrderExecutor {
  if (!executorInstance) {
    executorInstance = new OrderExecutor();
  }
  return executorInstance;
}

// Auto-start on import (only in production)
if (process.env.NODE_ENV === 'production') {
  getOrderExecutor();
}
