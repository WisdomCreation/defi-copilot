import type { SwapQuote, SupportedChain } from '@defi-copilot/shared';

const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY;
const ONEINCH_BASE_URL = 'https://api.1inch.dev/swap/v6.0';

interface OneInchQuoteResponse {
  dstAmount: string;
  estimatedGas?: number;
  protocols?: Array<Array<{ name: string }>>;
}

interface OneInchSwapResponse {
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gas: number;
    gasPrice: string;
  };
  dstAmount: string;
}

const CHAIN_IDS: Record<SupportedChain, number> = {
  ethereum: 1,
  arbitrum: 42161,
  polygon: 137,
  base: 8453,
  solana: 0,
};

const NATIVE_TOKENS: Record<SupportedChain, string> = {
  ethereum: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  arbitrum: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  polygon: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  base: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  solana: '',
};

const COMMON_TOKENS: Record<SupportedChain, Record<string, string>> = {
  ethereum: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  },
  base: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  arbitrum: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  },
  polygon: {
    MATIC: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  },
  solana: {},
};

function getTokenAddress(symbol: string, chain: SupportedChain): string {
  const upperSymbol = symbol.toUpperCase();
  return COMMON_TOKENS[chain][upperSymbol] || symbol;
}

function parseAmount(amount: string, decimals: number = 18): string {
  const num = parseFloat(amount);
  return (num * Math.pow(10, decimals)).toFixed(0);
}

function formatAmount(amount: string, decimals: number = 18): string {
  const num = BigInt(amount);
  const divisor = BigInt(Math.pow(10, decimals));
  const result = Number(num) / Number(divisor);
  return result.toFixed(6);
}

interface OneInchQuoteParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  chain: SupportedChain;
  slippage?: number;
  fromAddress?: string;
}

export async function get1inchQuote(
  params: OneInchQuoteParams
): Promise<SwapQuote | null> {
  if (params.chain === 'solana') {
    throw new Error('Solana not supported by 1inch. Use Jupiter instead.');
  }

  const chainId = CHAIN_IDS[params.chain];
  const tokenInAddress = getTokenAddress(params.tokenIn, params.chain);
  const tokenOutAddress = getTokenAddress(params.tokenOut, params.chain);
  const amount = parseAmount(params.amountIn, 18);

  const url = new URL(`${ONEINCH_BASE_URL}/${chainId}/quote`);
  url.searchParams.set('src', tokenInAddress);
  url.searchParams.set('dst', tokenOutAddress);
  url.searchParams.set('amount', amount);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${ONEINCH_API_KEY}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('1inch API error:', errorText);
      return null;
    }

    const data = await response.json() as OneInchQuoteResponse;

    const quote: SwapQuote = {
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      amountIn: params.amountIn,
      amountOut: data.dstAmount,
      amountOutFormatted: formatAmount(data.dstAmount, 18),
      priceImpact: data.estimatedGas ? ((data.estimatedGas / parseFloat(amount)) * 100).toFixed(2) : '0.00',
      estimatedGasUsd: '~$2.50',
      slippage: (params.slippage ?? 0.5).toString(),
      route: data.protocols?.[0]?.map((p: any) => p[0]?.name).filter(Boolean) || ['1inch'],
      chain: params.chain,
    };

    return quote;
  } catch (error) {
    console.error('Failed to fetch 1inch quote:', error);
    return null;
  }
}

export async function get1inchSwap(
  params: OneInchQuoteParams & { fromAddress: string }
): Promise<any> {
  if (params.chain === 'solana') {
    throw new Error('Solana not supported by 1inch. Use Jupiter instead.');
  }

  const chainId = CHAIN_IDS[params.chain];
  const tokenInAddress = getTokenAddress(params.tokenIn, params.chain);
  const tokenOutAddress = getTokenAddress(params.tokenOut, params.chain);
  const amount = parseAmount(params.amountIn, 18);
  const slippage = params.slippage ?? 0.5;

  const url = new URL(`${ONEINCH_BASE_URL}/${chainId}/swap`);
  url.searchParams.set('src', tokenInAddress);
  url.searchParams.set('dst', tokenOutAddress);
  url.searchParams.set('amount', amount);
  url.searchParams.set('from', params.fromAddress);
  url.searchParams.set('slippage', slippage.toString());
  url.searchParams.set('disableEstimate', 'true');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${ONEINCH_API_KEY}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`1inch swap API error: ${errorText}`);
    }

    const data = await response.json() as OneInchSwapResponse;
    return data;
  } catch (error) {
    console.error('Failed to get 1inch swap data:', error);
    throw error;
  }
}
