import prisma from './prisma';
import type { SupportedChain } from '@defi-copilot/shared';

interface CreateAlertParams {
  userId: string;
  asset: string;
  assetSymbol: string;
  condition: 'above' | 'below';
  targetPrice: number;
  currentPrice?: number;
  chain?: SupportedChain;
}

export async function createAlert(params: CreateAlertParams) {
  return prisma.priceAlert.create({
    data: {
      userId: params.userId,
      asset: params.asset,
      assetSymbol: params.assetSymbol,
      condition: params.condition,
      targetPrice: params.targetPrice,
      currentPrice: params.currentPrice,
      chain: params.chain ?? 'ethereum',
    },
  });
}

export async function getActiveAlerts(chain?: SupportedChain) {
  return prisma.priceAlert.findMany({
    where: {
      active: true,
      triggered: false,
      ...(chain && { chain }),
    },
    include: { user: true },
  });
}

export async function triggerAlert(alertId: string, currentPrice: number) {
  return prisma.priceAlert.update({
    where: { id: alertId },
    data: {
      triggered: true,
      triggeredAt: new Date(),
      currentPrice,
    },
  });
}

export async function deactivateAlert(alertId: string) {
  return prisma.priceAlert.update({
    where: { id: alertId },
    data: { active: false },
  });
}

export async function deleteAlert(alertId: string) {
  return prisma.priceAlert.delete({
    where: { id: alertId },
  });
}
