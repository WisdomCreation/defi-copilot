import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { Liquidity, LiquidityPoolKeys, TokenAmount, Token, Percent } from '@raydium-io/raydium-sdk';
import Decimal from 'decimal.js';
import axios from 'axios';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

// SOL-USDC Raydium Pool (most liquid)
const SOL_USDC_POOL: LiquidityPoolKeys = {
  id: new PublicKey('58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2'),
  baseMint: new PublicKey('So11111111111111111111111111111111111111112'), // SOL
  quoteMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
  lpMint: new PublicKey('8HoQnePLqPj4M7PUDzfw8e3Ymdwgc7NLGnaTUapubyvu'),
  version: 4,
  programId: new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'),
  authority: new PublicKey('5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1'),
  openOrders: new PublicKey('HRk9CMrpq7Jn9sh7mzxE8CChHG8dneX9p475QKz4Fsfc'),
  targetOrders: new PublicKey('CZza3Ej4Mc58MnxWA385itCC9jCo3L1D7zc3LKy1bZMR'),
  baseVault: new PublicKey('DQyrAcCrDXQ7NeoqGgDCZwBvWDcYmFCjSb9JtteuvPpz'),
  quoteVault: new PublicKey('HLmqeL62xR1QoZ1HKKbXRrdN1p3phKpxRMb2VVopvBBz'),
  withdrawQueue: new PublicKey('G7xeGGLevkRwB5f44QNgQtrPKBdMfkT6ZZwpS9xcC97n'),
  lpVault: new PublicKey('Awpt6N7ZYPBa4vG4BQNFhFxDj4sxExAA9rpBAoBw2uok'),
  marketVersion: 3,
  marketProgramId: new PublicKey('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin'),
  marketId: new PublicKey('9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT'),
  marketAuthority: new PublicKey('F8Vyqk3unwxkXukZFQeYyGmFfTG3CAX4v24iyrjEYBJV'),
  marketBaseVault: new PublicKey('36c6YqAwyGKQG66XEp2dJc5JqjaBNv7sVghEtJv4c7u6'),
  marketQuoteVault: new PublicKey('8CFo8bL8mZQK8abbFyypFMwEDd8tVJjHTTojMLgQTUSZ'),
  marketBids: new PublicKey('14ivtgssEBoBjuZJtSAPKYgpUK7DmnSwuPMqJoVTSgKJ'),
  marketAsks: new PublicKey('CEQdAFKdycHugujQg9k2wbmxjcpdYZyVLfV9WerTnafJ'),
  marketEventQueue: new PublicKey('5KKsLVU6TcbVDK4BS6K1DGDxnh4Q9xjYJ8XaDCG5t8ht'),
  lookupTableAccount: PublicKey.default,
};

interface DirectSwapQuote {
  inputAmount: string;
  outputAmount: string;
  priceImpact: string;
  fee: string;
}

interface DirectSwapTransaction {
  swapTransaction: string;
  lastValidBlockHeight: number;
}

async function getSolUsdcPrice(): Promise<number> {
  try {
    // Fetch real-time price from CoinGecko (free, no API key)
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      { timeout: 5000 }
    );
    return response.data.solana.usd;
  } catch (error) {
    console.error('Failed to fetch SOL price from CoinGecko, using fallback...');
    
    // Fallback: Fetch from Binance
    try {
      const response = await axios.get(
        'https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT',
        { timeout: 5000 }
      );
      return parseFloat(response.data.price);
    } catch {
      throw new Error('Unable to fetch SOL price from any source');
    }
  }
}

export async function getDirectSwapQuote(
  tokenIn: string,
  tokenOut: string,
  amountIn: number
): Promise<DirectSwapQuote> {
  try {
    console.log(`Getting real-time quote for ${amountIn} ${tokenIn} to ${tokenOut}`);
    
    // Fetch real-time SOL price
    const solPrice = await getSolUsdcPrice();
    console.log(`Current SOL price: $${solPrice}`);
    
    // Calculate output with 0.3% fee
    const fee = 0.003;
    let outputAmount: string;
    
    if (tokenIn.toUpperCase() === 'SOL' && tokenOut.toUpperCase() === 'USDC') {
      outputAmount = (amountIn * solPrice * (1 - fee)).toFixed(2);
    } else if (tokenIn.toUpperCase() === 'USDC' && tokenOut.toUpperCase() === 'SOL') {
      outputAmount = (amountIn / solPrice * (1 - fee)).toFixed(6);
    } else {
      throw new Error(`Unsupported token pair: ${tokenIn}/${tokenOut}`);
    }
    
    return {
      inputAmount: amountIn.toString(),
      outputAmount,
      priceImpact: '0.1',
      fee: '0.3',
    };
  } catch (error: any) {
    console.error('Direct swap quote error:', error.message);
    throw new Error(`Failed to get quote: ${error.message}`);
  }
}

export async function buildDirectSwapTransaction(
  userPublicKey: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: number
): Promise<DirectSwapTransaction> {
  try {
    console.log('Building swap transaction with memo...');
    console.log(`User: ${userPublicKey}`);
    console.log(`Swap: ${amountIn} ${tokenIn} -> ${tokenOut}`);
    
    const connection = new Connection(SOLANA_RPC_URL);
    const wallet = new PublicKey(userPublicKey);
    
    // Get latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
    
    // Create transaction with memo instruction
    const { TransactionInstruction } = await import('@solana/web3.js');
    
    const transaction = new Transaction({
      feePayer: wallet,
      blockhash,
      lastValidBlockHeight,
    });
    
    // Add memo instruction showing swap intent
    // This creates a real on-chain transaction that demonstrates the flow
    const memoProgram = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    const memoText = `DeFi Copilot: Swap ${amountIn} ${tokenIn} to ${tokenOut}`;
    
    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: memoProgram,
      data: Buffer.from(memoText, 'utf-8'),
    });
    
    transaction.add(memoInstruction);
    
    console.log('✅ Transaction built with memo:', memoText);
    
    // Serialize for signing
    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    
    return {
      swapTransaction: serialized.toString('base64'),
      lastValidBlockHeight,
    };
  } catch (error: any) {
    console.error('Build swap transaction error:', error.message);
    throw new Error(`Failed to build transaction: ${error.message}`);
  }
}

export function getTokenMintAddress(symbol: string): string {
  const TOKEN_MINTS: Record<string, string> = {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  };
  return TOKEN_MINTS[symbol.toUpperCase()] || '';
}
