// Action the AI resolved from user intent
export type TradeAction =
  | 'swap'
  | 'limit'
  | 'stop_loss'
  | 'dca'
  | 'bridge'
  | 'query'
  | 'alert';

// Parsed intent returned by Claude
export interface TradeIntent {
  action: TradeAction;
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  amountUsd?: string;
  triggerPrice?: string;       // e.g. "120" for "buy SOL below $120"
  triggerCondition?: 'above' | 'below';
  chain?: SupportedChain;
  bridgeTargetChain?: SupportedChain;
  dcaInterval?: string;        // e.g. "daily", "weekly"
  slippageTolerance?: number;  // percentage, e.g. 0.5
  clarificationNeeded: boolean;
  clarificationQuestion?: string;
}

export type SupportedChain =
  | 'ethereum'
  | 'base'
  | 'arbitrum'
  | 'polygon'
  | 'solana';

// Quote returned from 1inch / Jupiter before user confirms
export interface SwapQuote {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  amountOutFormatted: string;
  priceImpact: string;
  estimatedGasUsd: string;
  slippage: string;
  route: string[];             // DEX names in the route
  calldata?: string;           // raw tx calldata (EVM)
  chain: SupportedChain;
}

// Order stored in DB (limit, stop-loss, DCA)
export type OrderStatus = 'watching' | 'filled' | 'cancelled' | 'failed';
export type OrderType = 'limit' | 'stop_loss' | 'dca' | 'bridge';

export interface Order {
  id: string;
  userId: string;
  type: OrderType;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  triggerPrice?: string;
  signedTx?: string;
  status: OrderStatus;
  chain: SupportedChain;
  txHash?: string;
  createdAt: Date;
  filledAt?: Date;
}

// Price alert
export interface PriceAlert {
  id: string;
  userId: string;
  asset: string;
  condition: 'above' | 'below';
  price: number;
  triggered: boolean;
  createdAt: Date;
}

// API request shape for the copilot endpoint
export interface CopilotRequest {
  message: string;
  walletAddress: string;
  chain: SupportedChain;
  conversationId?: string;
}

// API response shape
export interface CopilotResponse {
  reply: string;                // Human-readable AI response
  intent?: TradeIntent;         // Parsed intent (if action detected)
  quote?: SwapQuote;            // Ready-to-confirm quote (if swap)
  requiresConfirmation: boolean;
  conversationId: string;
}
