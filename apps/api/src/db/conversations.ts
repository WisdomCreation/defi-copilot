import prisma from './prisma';
import type { SupportedChain, TradeIntent, SwapQuote } from '@defi-copilot/shared';

export async function findOrCreateConversation(
  userId: string,
  walletAddress: string,
  chain: SupportedChain,
  conversationId?: string
) {
  if (conversationId) {
    const existing = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (existing) return existing;
  }

  return prisma.conversation.create({
    data: {
      userId,
      walletAddress: walletAddress.toLowerCase(),
      chain,
    },
    include: { messages: true },
  });
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  intent?: TradeIntent,
  quote?: SwapQuote
) {
  return prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      intent: intent ?? null,
      quote: quote ?? null,
    },
  });
}

export async function getConversation(conversationId: string) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

export async function getUserConversations(userId: string, limit = 20) {
  return prisma.conversation.findMany({
    where: { userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 5,
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });
}
