import axios from 'axios';
import { PublicKey } from '@solana/web3.js';

const JUPITER_API_KEY = process.env.JUPITER_API_KEY;
const JUPITER_API_BASE = 'https://quote-api.jup.ag/v6';

// Solana token addresses
const TOKEN_ADDRESSES: Record<string, string> = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
};

interface JupiterQuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
}

interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: any[];
}

interface SwapTransaction {
  swapTransaction: string;
  lastValidBlockHeight: number;
}

export async function getJupiterQuote(params: JupiterQuoteParams): Promise<JupiterQuote> {
  const { inputMint, outputMint, amount, slippageBps } = params;

  try {
    const response = await axios.get(`${JUPITER_API_BASE}/quote`, {
      params: {
        inputMint,
        outputMint,
        amount: amount.toString(),
        slippageBps: (slippageBps || 50).toString(),
      },
      headers: JUPITER_API_KEY ? { 'x-api-key': JUPITER_API_KEY } : {},
      timeout: 10000,
    });

    if (!response.data) {
      throw new Error('No quote returned from Jupiter');
    }

    return response.data;
  } catch (error: any) {
    console.error('Jupiter quote error:', error.message);
    throw new Error(`Failed to get quote from Jupiter: ${error.message}`);
  }
}

export async function getSwapTransaction(
  quoteResponse: JupiterQuote,
  userPublicKey: string
): Promise<SwapTransaction> {
  console.log('Requesting swap transaction from Jupiter...');
  console.log('User public key:', userPublicKey);

  try {
    const response = await axios.post(
      `${JUPITER_API_BASE}/swap`,
      {
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      },
      {
        headers: JUPITER_API_KEY ? { 'x-api-key': JUPITER_API_KEY } : {},
        timeout: 30000,
      }
    );

    if (!response.data || !response.data.swapTransaction) {
      throw new Error('No swap transaction returned from Jupiter');
    }

    console.log('Jupiter swap transaction received successfully');
    return response.data;
  } catch (error: any) {
    console.error('Jupiter swap transaction error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
      console.error('Response headers:', error.response.headers);
    }
    if (error.code) {
      console.error('Error code:', error.code);
    }
    throw new Error(`Failed to build swap transaction: ${error.response?.data?.error || error.message}`);
  }
}

export function getTokenAddress(symbol: string): string {
  const upperSymbol = symbol.toUpperCase();
  return TOKEN_ADDRESSES[upperSymbol] || symbol;
}

export function lamportsToSol(lamports: string): number {
  return parseInt(lamports) / 1_000_000_000;
}

export function solToLamports(sol: number): string {
  return Math.floor(sol * 1_000_000_000).toString();
}

export function usdcToBaseUnits(usdc: number): string {
  return Math.floor(usdc * 1_000_000).toString();
}

export function baseUnitsToUsdc(baseUnits: string): number {
  return parseInt(baseUnits) / 1_000_000;
}
