import axios from 'axios';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'ecb08fab-1799-46af-b0e9-4f324367d2bb';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// ─── Token map ─────────────────────────────────────────────────────────────
const TOKEN_IDS: Record<string, string> = {
  SOL: 'solana', ETH: 'ethereum', BTC: 'bitcoin', USDC: 'usd-coin',
  USDT: 'tether', BNB: 'binancecoin', MATIC: 'matic-network', ARB: 'arbitrum',
};

const SOL_MINTS: Record<string, string> = {
  So11111111111111111111111111111111111111112: 'SOL',
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'USDC',
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 'USDT',
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: 'mSOL',
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': 'ETH',
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: 'BONK',
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: 'JUP',
};

// ─── Portfolio handler ──────────────────────────────────────────────────────
export async function handlePortfolioQuery(walletAddress: string, queryType: string) {
  try {
    // Fetch token balances from Helius
    const { data: balanceData } = await axios.post(
      `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
      { jsonrpc: '2.0', id: 1, method: 'getAssetsByOwner', params: { ownerAddress: walletAddress, page: 1, limit: 100, displayOptions: { showFungible: true, showNativeBalance: true } } },
      { timeout: 10000 }
    );

    const nativeSOL = (balanceData?.result?.nativeBalance?.lamports || 0) / 1e9;
    const fungibles: any[] = balanceData?.result?.items?.filter((i: any) => i.interface === 'FungibleToken' && i.token_info?.balance > 0) || [];

    // Get SOL price
    const { data: priceData } = await axios.get(`${COINGECKO_BASE}/simple/price?ids=solana,usd-coin&vs_currencies=usd&include_24hr_change=true`, { timeout: 8000 });
    const solPrice = priceData?.solana?.usd || 0;
    const solChange = priceData?.solana?.usd_24h_change || 0;

    // Build holdings
    const holdings: any[] = [];

    if (nativeSOL > 0.001) {
      holdings.push({ symbol: 'SOL', amount: nativeSOL, usdValue: nativeSOL * solPrice, change24h: solChange, price: solPrice });
    }

    for (const token of fungibles.slice(0, 10)) {
      const info = token.token_info;
      const decimals = info?.decimals || 6;
      const amount = (info?.balance || 0) / Math.pow(10, decimals);
      const price = info?.price_info?.price_per_token || 0;
      const usdValue = amount * price;
      if (usdValue < 0.01) continue;

      const symbol = info?.symbol || SOL_MINTS[token.id] || token.id?.slice(0, 6);
      holdings.push({ symbol, amount, usdValue, price, change24h: 0, mint: token.id });
    }

    holdings.sort((a, b) => b.usdValue - a.usdValue);
    const totalUsd = holdings.reduce((sum, h) => sum + h.usdValue, 0);

    return { type: 'portfolio', holdings, totalUsd, walletAddress };
  } catch (err: any) {
    console.error('Portfolio query error:', err.message);
    return { type: 'portfolio', holdings: [], totalUsd: 0, error: err.message };
  }
}

// ─── Market intel handler ───────────────────────────────────────────────────
export async function handleMarketQuery(queryType: string, queryToken?: string) {
  try {
    const results: any = { type: 'market', queryType, queryToken };

    if (queryType === 'price' || queryType === 'sentiment' || !queryType) {
      const tokens = queryToken ? [queryToken.toLowerCase()] : ['solana', 'ethereum', 'bitcoin'];
      const ids = tokens.map(t => TOKEN_IDS[t.toUpperCase()] || t).join(',');
      const { data } = await axios.get(
        `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=10&sparkline=false&price_change_percentage=24h,7d`,
        { timeout: 8000 }
      );
      results.prices = data;
    }

    if (queryType === 'trending') {
      const { data } = await axios.get(`${COINGECKO_BASE}/search/trending`, { timeout: 8000 });
      results.trending = data?.coins?.slice(0, 7).map((c: any) => ({
        name: c.item.name,
        symbol: c.item.symbol,
        rank: c.item.market_cap_rank,
        thumb: c.item.thumb,
        priceBtc: c.item.price_btc,
      }));
    }

    if (queryType === 'fear_greed' || queryType === 'sentiment') {
      const { data } = await axios.get('https://api.alternative.me/fng/?limit=1', { timeout: 5000 });
      const fg = data?.data?.[0];
      results.fearGreed = { value: fg?.value, label: fg?.value_classification, updated: fg?.timestamp };
    }

    if (queryType === 'tvl') {
      const protocol = queryToken?.toLowerCase() || 'aave';
      const { data } = await axios.get(`https://api.llama.fi/protocol/${protocol}`, { timeout: 8000 });
      results.tvl = { name: data?.name, tvl: data?.tvl?.[data.tvl.length - 1]?.totalLiquidityUSD, symbol: data?.symbol };
    }

    return results;
  } catch (err: any) {
    console.error('Market query error:', err.message);
    return { type: 'market', error: err.message };
  }
}

// ─── Yield handler ──────────────────────────────────────────────────────────
export async function handleYieldQuery(queryToken?: string) {
  try {
    const { data } = await axios.get('https://yields.llama.fi/pools', { timeout: 12000 });
    const pools: any[] = data?.data || [];

    const token = (queryToken || 'USDC').toUpperCase();
    const relevant = pools
      .filter((p: any) => p.symbol?.toUpperCase().includes(token) && p.apy > 0 && p.tvlUsd > 500000)
      .sort((a: any, b: any) => b.apy - a.apy)
      .slice(0, 8)
      .map((p: any) => ({
        protocol: p.project,
        chain: p.chain,
        symbol: p.symbol,
        apy: p.apy?.toFixed(2),
        tvl: p.tvlUsd,
        risk: p.apy > 20 ? 'high' : p.apy > 8 ? 'medium' : 'low',
      }));

    return { type: 'yield', token, pools: relevant };
  } catch (err: any) {
    console.error('Yield query error:', err.message);
    return { type: 'yield', pools: [], error: err.message };
  }
}

// ─── Recent transactions handler ────────────────────────────────────────────
export async function handleTransactionHistory(walletAddress: string) {
  try {
    const { data } = await axios.post(
      `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=10&type=SWAP`,
      {},
      { timeout: 10000 }
    );

    const txs = (data || []).slice(0, 10).map((tx: any) => ({
      signature: tx.signature,
      timestamp: tx.timestamp,
      type: tx.type,
      description: tx.description,
      fee: (tx.fee || 0) / 1e9,
    }));

    return { type: 'transactions', txs };
  } catch (err: any) {
    return { type: 'transactions', txs: [], error: err.message };
  }
}
