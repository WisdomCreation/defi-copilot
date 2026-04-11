import axios from 'axios';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'ecb08fab-1799-46af-b0e9-4f324367d2bb';

const MINT_SYMBOL: Record<string, string> = {
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
  'So11111111111111111111111111111111111111112': 'SOL',
};
const SYMBOL_MINT: Record<string, string> = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  SOL:  'So11111111111111111111111111111111111111112',
};
const TOKEN_DECIMALS: Record<string, number> = { USDC: 6, USDT: 6, SOL: 9 };

// ─── Resolve ENS / .sol / raw address ───────────────────────────────────────
export async function resolveRecipient(recipient: string): Promise<{ address: string; displayName: string; resolved: boolean }> {
  const raw = recipient.trim();

  // Already a Solana base58 address (32-44 chars, alphanumeric)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(raw)) {
    return { address: raw, displayName: raw, resolved: false };
  }

  // .sol domain via Bonfida SNS
  if (raw.endsWith('.sol')) {
    try {
      const domain = raw.replace('.sol', '');
      const { data } = await axios.get(
        `https://sns-sdk-proxy.bonfida.workers.dev/resolve/${domain}`,
        { timeout: 6000 }
      );
      const address = data?.result;
      if (address) return { address, displayName: raw, resolved: true };
    } catch {}
  }

  // ENS (.eth) — resolve via public Ethereum node for EVM addresses
  if (raw.endsWith('.eth')) {
    try {
      const { data } = await axios.post(
        'https://cloudflare-eth.com',
        { jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e', data: '0x3b3b57de' + raw }, 'latest'] },
        { timeout: 6000 }
      );
      // Return ENS address as EVM address — note: on Solana chain this is informational only
      return { address: raw, displayName: raw, resolved: false };
    } catch {}
  }

  return { address: raw, displayName: raw, resolved: false };
}

// ─── Build payment preview (for confirmation card) ──────────────────────────
export async function buildPaymentPreview(params: {
  fromWallet: string;
  recipient: string;
  token: string;
  amount: number;
  memo?: string;
}) {
  const { fromWallet, recipient, token, amount, memo } = params;
  const resolved = await resolveRecipient(recipient);

  // Get current SOL price for USD estimate
  let usdValue = amount;
  if (token.toUpperCase() === 'SOL') {
    try {
      const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd', { timeout: 5000 });
      usdValue = amount * (data?.solana?.usd || 0);
    } catch {}
  }

  const mint = SYMBOL_MINT[token.toUpperCase()];
  const decimals = TOKEN_DECIMALS[token.toUpperCase()] || 6;

  return {
    type: 'payment_preview',
    fromWallet,
    toAddress: resolved.address,
    toDisplay: resolved.displayName,
    resolved: resolved.resolved,
    token: token.toUpperCase(),
    amount,
    usdValue: usdValue.toFixed(2),
    mint,
    decimals,
    memo: memo || null,
    network: 'solana',
  };
}

// ─── Build batch payment preview ─────────────────────────────────────────────
export async function buildBatchPaymentPreview(params: {
  fromWallet: string;
  recipients: Array<{ address: string; amount: number }>;
  token: string;
  splitEqually?: boolean;
  totalAmount?: number;
}) {
  const { fromWallet, recipients, token, splitEqually, totalAmount } = params;
  const perRecipient = splitEqually && totalAmount ? totalAmount / recipients.length : null;

  const resolved = await Promise.all(
    recipients.map(async (r) => {
      const res = await resolveRecipient(r.address);
      return { ...r, ...res, amount: perRecipient ?? r.amount };
    })
  );

  const total = resolved.reduce((s, r) => s + r.amount, 0);

  return {
    type: 'batch_payment_preview',
    fromWallet,
    token: token.toUpperCase(),
    recipients: resolved,
    total,
    network: 'solana',
  };
}

// ─── Generate payment request link ───────────────────────────────────────────
export function buildPaymentLink(params: { toWallet: string; token: string; amount: number; memo?: string }) {
  const { toWallet, token, amount, memo } = params;
  // Solana Pay URL scheme
  const mint = SYMBOL_MINT[token.toUpperCase()];
  let url = `solana:${toWallet}?amount=${amount}`;
  if (mint && token.toUpperCase() !== 'SOL') url += `&spl-token=${mint}`;
  if (memo) url += `&memo=${encodeURIComponent(memo)}`;

  // Also build a deeplink-friendly web URL
  const webUrl = `https://defi-copilot-web.vercel.app/pay?to=${toWallet}&amount=${amount}&token=${token.toUpperCase()}${memo ? `&memo=${encodeURIComponent(memo)}` : ''}`;

  return {
    type: 'payment_link',
    toWallet,
    token: token.toUpperCase(),
    amount,
    solanaPayUrl: url,
    webUrl,
    qrData: url,
  };
}

// ─── Spending summary ─────────────────────────────────────────────────────────
export async function buildSpendingSummary(walletAddress: string) {
  try {
    const { data } = await axios.get(
      `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions`,
      { params: { 'api-key': HELIUS_API_KEY, limit: 100 }, timeout: 12000 }
    );
    const txs = Array.isArray(data) ? data : [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;

    let totalSolOut = 0;
    let totalUsdcOut = 0;
    const transfers: any[] = [];

    for (const tx of txs) {
      if ((tx.timestamp || 0) < monthStart) continue;
      if (tx.type !== 'TRANSFER') continue;

      const walletAcc = (tx.accountData || []).find((a: any) => a.account === walletAddress);
      const solChange = walletAcc ? walletAcc.nativeBalanceChange / 1e9 : 0;

      for (const t of tx.tokenTransfers || []) {
        if (t.fromUserAccount === walletAddress && t.tokenAmount > 0) {
          const symbol = MINT_SYMBOL[t.mint] || 'TOKEN';
          if (symbol === 'USDC') totalUsdcOut += t.tokenAmount;
          transfers.push({
            date: new Date(tx.timestamp * 1000).toISOString().split('T')[0],
            to: t.toUserAccount?.slice(0, 8) + '...',
            token: symbol,
            amount: t.tokenAmount,
            signature: tx.signature,
          });
        }
      }
      if (solChange < -0.01) {
        totalSolOut += Math.abs(solChange);
        transfers.push({
          date: new Date(tx.timestamp * 1000).toISOString().split('T')[0],
          to: 'multiple',
          token: 'SOL',
          amount: Math.abs(solChange),
          signature: tx.signature,
        });
      }
    }

    // Get SOL price
    let solPrice = 0;
    try {
      const { data: p } = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd', { timeout: 5000 });
      solPrice = p?.solana?.usd || 0;
    } catch {}

    const totalUsd = totalUsdcOut + totalSolOut * solPrice;

    return {
      type: 'spending_summary',
      month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      totalSolOut: totalSolOut.toFixed(4),
      totalUsdcOut: totalUsdcOut.toFixed(2),
      totalUsd: totalUsd.toFixed(2),
      transferCount: transfers.length,
      transfers: transfers.slice(0, 8),
    };
  } catch (err: any) {
    return { type: 'spending_summary', error: err.message, transfers: [], totalUsd: '0' };
  }
}

// ─── Parse bulk CSV payments ──────────────────────────────────────────────────
export function parseBulkCSV(csv: string, token: string, fromWallet: string) {
  const lines = csv.trim().split('\n').filter(Boolean);
  const recipients: any[] = [];
  for (const line of lines) {
    const [address, amountStr] = line.split(',').map(s => s.trim());
    const amount = parseFloat(amountStr);
    if (address && !isNaN(amount)) {
      recipients.push({ address, amount });
    }
  }
  const total = recipients.reduce((s, r) => s + r.amount, 0);
  return {
    type: 'batch_payment_preview',
    fromWallet,
    token: token.toUpperCase(),
    recipients,
    total,
    network: 'solana',
  };
}
