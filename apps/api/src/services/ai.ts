import OpenAI from 'openai';
import type { TradeIntent, SupportedChain } from '@defi-copilot/shared';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are DeFi Copilot, a non-custodial trading assistant.
Your job is to parse user trading intent and return a JSON object plus a short human-readable reply.

Rules:
1. Always respond with a JSON block followed by a plain-English reply.
2. Never suggest specific investments or give financial advice.
3. If the user provides token names and amounts, extract them immediately - do NOT ask for clarification.
4. Only set clarificationNeeded: true if critical information is completely missing (e.g., "swap some tokens" with no token names).
5. Private keys and signing always happen on the user's device — you never touch funds.
6. Be decisive and helpful - if you can infer the intent, do it.

Response format (always return this exact JSON structure, then a newline, then your reply):
\`\`\`json
{
  "action": "swap|limit|stop_loss|dca|bridge|query|alert",
  "tokenIn": "ETH",
  "tokenOut": "USDC",
  "amountIn": null,
  "amountUsd": "500",
  "triggerPrice": null,
  "triggerCondition": null,
  "chain": "ethereum",
  "bridgeTargetChain": null,
  "dcaInterval": null,
  "slippageTolerance": 0.5,
  "clarificationNeeded": false,
  "clarificationQuestion": null
}
\`\`\`
Your reply here.`;

interface ParseIntentParams {
  message: string;
  walletAddress: string;
  chain: SupportedChain;
}

interface ParseIntentResult {
  reply: string;
  intent?: TradeIntent;
}

export async function parseIntent(params: ParseIntentParams): Promise<ParseIntentResult> {
  const { message, walletAddress, chain } = params;

  const userContext = `Wallet: ${walletAddress}\nCurrent chain: ${chain}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `${userContext}\n\nUser message: ${message}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || '';

  // Extract JSON block from response
  const jsonMatch = raw.match(/```json\n([\s\S]*?)\n```/);
  const replyText = raw.replace(/```json\n[\s\S]*?\n```/, '').trim();

  if (!jsonMatch) {
    return { reply: raw };
  }

  try {
    const intent = JSON.parse(jsonMatch[1]) as TradeIntent;
    return { reply: replyText, intent };
  } catch {
    return { reply: replyText };
  }
}
