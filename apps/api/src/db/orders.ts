import prisma from './prisma';
import type { Order, OrderType, OrderStatus, SupportedChain } from '@defi-copilot/shared';

interface CreateOrderParams {
  userId: string;
  type: OrderType;
  tokenIn: string;
  tokenInAddress?: string;
  tokenOut: string;
  tokenOutAddress?: string;
  amountIn: string;
  amountUsd?: string;
  triggerPrice?: string;
  triggerCondition?: 'above' | 'below';
  chain: SupportedChain;
  bridgeTargetChain?: SupportedChain;
  dcaInterval?: string;
  dcaMaxExecutions?: number;
  slippage?: number;
  signedTx?: string;
}

export async function createOrder(params: CreateOrderParams) {
  return prisma.order.create({
    data: {
      userId: params.userId,
      type: params.type,
      tokenIn: params.tokenIn,
      tokenInAddress: params.tokenInAddress,
      tokenOut: params.tokenOut,
      tokenOutAddress: params.tokenOutAddress,
      amountIn: params.amountIn,
      amountUsd: params.amountUsd,
      triggerPrice: params.triggerPrice,
      triggerCondition: params.triggerCondition,
      chain: params.chain,
      bridgeTargetChain: params.bridgeTargetChain,
      dcaInterval: params.dcaInterval,
      dcaMaxExecutions: params.dcaMaxExecutions,
      slippage: params.slippage ?? 0.5,
      signedTx: params.signedTx,
      status: 'watching',
    },
  });
}

export async function getOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });
}

export async function getActiveOrders(chain?: SupportedChain) {
  return prisma.order.findMany({
    where: {
      status: 'watching',
      ...(chain && { chain }),
    },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  txHash?: string
) {
  const data: any = { status };
  
  if (status === 'filled') {
    data.filledAt = new Date();
  } else if (status === 'cancelled') {
    data.cancelledAt = new Date();
  }
  
  if (txHash) {
    data.txHash = txHash;
  }

  return prisma.order.update({
    where: { id: orderId },
    data,
  });
}

export async function cancelOrder(orderId: string) {
  return updateOrderStatus(orderId, 'cancelled');
}

export async function incrementDcaExecutions(orderId: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      dcaExecutions: {
        increment: 1,
      },
    },
  });
}
