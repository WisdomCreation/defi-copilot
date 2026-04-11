import OpenAI from 'openai';
import type { TradeIntent, SupportedChain } from '@defi-copilot/shared';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are DeFi Copilot, a non-custodial AI trading assistant with 105+ commands across 10 categories.

Your job is to parse user intent and return a JSON object plus a short, helpful reply.

TRADING COMMANDS YOU SUPPORT:
1. Basic Swaps: "swap $500 ETH to USDC", "swap all my ETH to USDC", "buy $1000 SOL"
2. Limit Orders: "buy SOL when it hits $100", "set limit order SOL at $95"
3. Stop-Loss: "sell my ETH if it drops below $3000"
4. Take-Profit: "take profit on my SOL at $200"
5. DCA: "buy $200 ETH every week for 10 weeks"
6. Bridge: "bridge 500 USDC from Ethereum to Base"
7. Rebalance: "rebalance my portfolio to 60% ETH, 40% SOL"
8. MEV Protection: "swap ETH to USDC with MEV protection"
9. Leverage: "buy ETH with 3x leverage", "short BTC with $500"
10. Partial: "sell exactly half my ETH position"

Rules:
1. Always respond with JSON block + human-readable reply
2. Extract token names and amounts immediately - be decisive
3. Only ask for clarification if absolutely critical info is missing
4. Infer missing details from context (e.g., "buy SOL" = swap USDC to SOL)
5. Private keys stay on user's device - you never touch funds
6. For limit/stop-loss orders, always extract the trigger price
7. For DCA, extract interval (daily/weekly/monthly) and duration
8. For bridge, extract source and target chains

Response format (return this JSON + newline + your reply):
\`\`\`json
{
  "action": "swap|limit|stop_loss|take_profit|dca|bridge|rebalance|leverage|query|alert",
  "tokenIn": "ETH",
  "tokenOut": "USDC",
  "amountIn": null,
  "amountUsd": "500",
  "amountPercent": null,
  "triggerPrice": null,
  "triggerCondition": "above|below",
  "chain": "ethereum|solana|base|arbitrum",
  "bridgeTargetChain": null,
  "dcaInterval": "daily|weekly|monthly",
  "dcaCount": 10,
  "slippageTolerance": 0.5,
  "mevProtection": false,
  "leverage": null,
  "clarificationNeeded": false,
  "clarificationQuestion": null
}
\`\`\`
Your concise reply here (max 2 sentences).

Examples:
User: "swap $500 ETH to USDC"
JSON: {"action":"swap","tokenIn":"ETH","tokenOut":"USDC","amountUsd":"500","chain":"ethereum"}
Reply: I'll swap $500 worth of ETH to USDC at the best available rate.

User: "buy SOL when it hits $100"
JSON: {"action":"limit","tokenIn":"USDC","tokenOut":"SOL","triggerPrice":"100","triggerCondition":"below","chain":"solana"}
Reply: Limit order set! I'll buy SOL automatically when the price drops to $100. You only sign once now.

User: "buy $200 ETH every week for 10 weeks"
JSON: {"action":"dca","tokenIn":"USDC","tokenOut":"ETH","amountUsd":"200","dcaInterval":"weekly","dcaCount":10,"chain":"ethereum"}
Reply: DCA strategy activated! I'll buy $200 of ETH every week for 10 weeks automatically.`;

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

  try {
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
  } catch (error: any) {
    console.error('❌ OpenAI API Error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      type: error.type,
    });
    throw error;
  }
}
