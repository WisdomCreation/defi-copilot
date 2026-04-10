import prisma from './prisma';
import type { SupportedChain } from '@defi-copilot/shared';

export async function findOrCreateUser(walletAddress: string, chain: SupportedChain) {
  const existing = await prisma.user.findUnique({
    where: { walletAddress: walletAddress.toLowerCase() },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { lastActiveAt: new Date() },
    });
    return existing;
  }

  return prisma.user.create({
    data: {
      walletAddress: walletAddress.toLowerCase(),
      chain,
    },
  });
}

export async function getUserByWallet(walletAddress: string) {
  return prisma.user.findUnique({
    where: { walletAddress: walletAddress.toLowerCase() },
  });
}

export async function getUserOrders(userId: string, status?: string) {
  return prisma.order.findMany({
    where: {
      userId,
      ...(status && { status }),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserAlerts(userId: string, active?: boolean) {
  return prisma.priceAlert.findMany({
    where: {
      userId,
      ...(active !== undefined && { active }),
    },
    orderBy: { createdAt: 'desc' },
  });
}
