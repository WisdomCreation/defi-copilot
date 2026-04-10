import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { WhirlpoolContext, buildWhirlpoolClient, ORCA_WHIRLPOOL_PROGRAM_ID, PDAUtil, swapQuoteByInputToken, SwapUtils } from '@orca-so/whirlpools-sdk';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import Decimal from 'decimal.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

// SOL/USDC Whirlpool address
const SOL_USDC_WHIRLPOOL = new PublicKey('HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ');

export async function buildOrcaSwapTransaction(
  userPublicKey: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: number
): Promise<{ swapTransaction: string; lastValidBlockHeight: number }> {
  try {
    console.log('🌊 Building Orca swap transaction...');
    console.log(`User: ${userPublicKey}`);
    console.log(`Swap: ${amountIn} ${tokenIn} -> ${tokenOut}`);

    const connection = new Connection(SOLANA_RPC_URL);
    const wallet = new PublicKey(userPublicKey);

    // Create a dummy wallet for building the transaction (user will sign)
    const dummyKeypair = Keypair.generate();
    const dummyWallet = new Wallet(dummyKeypair);
    const provider = new AnchorProvider(connection, dummyWallet, {});
    const ctx = WhirlpoolContext.withProvider(provider, ORCA_WHIRLPOOL_PROGRAM_ID);
    const client = buildWhirlpoolClient(ctx);

    // Get the whirlpool
    const whirlpool = await client.getPool(SOL_USDC_WHIRLPOOL);
    const whirlpoolData = await whirlpool.refreshData();

    console.log('✅ Whirlpool data fetched');

    // Calculate amount in smallest units
    const amountInLamports = Math.floor(amountIn * 1e9);

    // Get swap quote
    const quote = await swapQuoteByInputToken(
      whirlpool,
      whirlpoolData.tokenMintA, // SOL
      new Decimal(amountInLamports),
      Decimal.max(1, new Decimal(0.01)), // 1% slippage
      ctx.program.programId,
      ctx.fetcher,
      true
    );

    console.log('✅ Swap quote calculated:', {
      estimatedAmountIn: quote.estimatedAmountIn.toString(),
      estimatedAmountOut: quote.estimatedAmountOut.toString(),
    });

    // Build swap instruction
    const tx = await whirlpool.swap(quote);
    
    // Replace fee payer with user's wallet
    tx.feePayer = wallet;
    
    // Get fresh blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
    tx.recentBlockhash = blockhash;

    console.log('✅ Orca swap transaction built successfully');

    // Serialize for signing
    const serialized = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    return {
      swapTransaction: serialized.toString('base64'),
      lastValidBlockHeight,
    };
  } catch (error: any) {
    console.error('❌ Orca swap error:', error.message);
    console.error('Stack:', error.stack);
    throw new Error(`Failed to build Orca swap: ${error.message}`);
  }
}
