/**
 * Order Executor — Jupiter Trigger Integration
 *
 * Architecture: Jupiter Trigger V1 handles ALL execution.
 *   1. User places order → signs once → funds sit in Jupiter's on-chain PDA escrow
 *   2. Jupiter keepers monitor price 24/7 and execute automatically
 *   3. This service only syncs status: polls Jupiter's open-orders API
 *      and marks orders as "filled" in our DB when Jupiter has executed them
 *
 * We NEVER hold private keys, pre-signed transactions, or execute on behalf of users.
 */

import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../db/prisma';
import axios from 'axios';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Keep queue export so existing route imports don't break
export const orderQueue = new Queue('orders', { connection });

const JUPITER_API = 'https://api.jup.ag';
const SYNC_INTERVAL_MS = 30_000; // sync every 30 seconds

export class OrderExecutor {
  constructor() {
    this.startStatusSync();
  }

  // ─── Jupiter Status Sync ────────────────────────────────────────────────────

  private async startStatusSync() {
    console.log('🔄 Jupiter order status sync started (interval: 30s)');
    // Immediate first run
    await this.syncJupiterOrderStatuses().catch((e) =>
      console.error('Initial sync error:', e)
    );
    setInterval(() => {
      this.syncJupiterOrderStatuses().catch((e) =>
        console.error('Sync error:', e)
      );
    }, SYNC_INTERVAL_MS);
  }

  /**
   * For every wallet that has active Jupiter orders in our DB,
   * compare against Jupiter's open-orders API.
   * Any order that is no longer open has been filled → update our DB.
   */
  private async syncJupiterOrderStatuses() {
    const watchingOrders = await (prisma.order.findMany as any)({
      where: {
        status: 'watching',
        jupiterOrderKey: { not: null },
      },
      include: { user: { select: { walletAddress: true } } },
    });

    if (watchingOrders.length === 0) return;

    // Group by wallet so we make one API call per wallet
    const byWallet = new Map<string, typeof watchingOrders>();
    for (const order of watchingOrders) {
      const wallet = order.user.walletAddress;
      if (!byWallet.has(wallet)) byWallet.set(wallet, []);
      byWallet.get(wallet)!.push(order);
    }

    for (const [wallet, orders] of byWallet) {
      try {
        const openKeys = await this.fetchJupiterOpenOrderKeys(wallet);

        for (const order of orders) {
          if (order.jupiterOrderKey && !openKeys.has(order.jupiterOrderKey)) {
            // No longer in Jupiter's open orders → filled (or expired/cancelled on Jupiter side)
            await prisma.order.update({
              where: { id: order.id },
              data: { status: 'filled', filledAt: new Date() },
            });
            console.log(
              `✅ Order ${order.id} synced as filled (Jupiter key: ${order.jupiterOrderKey})`
            );
          }
        }
      } catch (err) {
        console.error(`Sync error for wallet ${wallet}:`, err);
      }
    }
  }

  /**
   * Fetch all open Jupiter Trigger V1 order keys for a wallet.
   * Returns a Set of order public keys.
   */
  private async fetchJupiterOpenOrderKeys(
    walletAddress: string
  ): Promise<Set<string>> {
    try {
      const { data } = await axios.get(`${JUPITER_API}/trigger/v1/getTriggerOrders`, {
        params: { user: walletAddress, orderStatus: 'active' },
        timeout: 10_000,
        headers: process.env.JUPITER_API_KEY
          ? { 'x-api-key': process.env.JUPITER_API_KEY }
          : {},
      });

      const orders: any[] = Array.isArray(data) ? data : data?.orders ?? [];
      return new Set(
        orders.map((o) => o.orderKey ?? o.publicKey ?? o.account).filter(Boolean)
      );
    } catch (err: any) {
      console.error(
        `Jupiter open-orders fetch failed for ${walletAddress}:`,
        err?.response?.data ?? err.message
      );
      return new Set(); // Safe fallback — don't mark anything as filled on API error
    }
  }

  // ─── Cancel ────────────────────────────────────────────────────────────────

  /**
   * Get an UNSIGNED cancel transaction from Jupiter for a given order.
   * The frontend signs it with the user's wallet and broadcasts it.
   * Returns base64-encoded unsigned transaction.
   */
  async getCancelTransaction(
    jupiterOrderKey: string,
    walletAddress: string
  ): Promise<string> {
    const { data } = await axios.post(
      `${JUPITER_API}/trigger/v1/cancelOrder`,
      { maker: walletAddress, order: jupiterOrderKey },
      {
        headers: process.env.JUPITER_API_KEY
          ? { 'x-api-key': process.env.JUPITER_API_KEY }
          : {},
        timeout: 10_000,
      }
    );

    if (!data?.tx) {
      throw new Error('Jupiter did not return a cancel transaction');
    }

    return data.tx; // base64 unsigned VersionedTransaction
  }

  /**
   * Mark an order as cancelled in our database.
   * Called after the user has signed + broadcast the Jupiter cancel tx.
   */
  async cancelOrder(orderId: string) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });
    console.log(`❌ Order ${orderId} cancelled`);
  }

  /**
   * Schedule a time-based order (retained for legacy support).
   */
  async scheduleOrder(orderId: string, executeAt: Date) {
    const delay = executeAt.getTime() - Date.now();
    if (delay > 0) {
      await orderQueue.add('execute-order', { orderId }, { delay });
      console.log(`⏰ Order ${orderId} scheduled for ${executeAt.toISOString()}`);
    }
  }
}

// Singleton
let executorInstance: OrderExecutor | null = null;

export function getOrderExecutor(): OrderExecutor {
  if (!executorInstance) {
    executorInstance = new OrderExecutor();
  }
  return executorInstance;
}

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  getOrderExecutor();
}
