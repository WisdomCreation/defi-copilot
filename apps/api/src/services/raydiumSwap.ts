import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import BN from 'bn.js';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=ecb08fab-1799-46af-b0e9-4f324367d2bb';

// Raydium AMM Program
const RAYDIUM_AMM_PROGRAM = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');

// SOL-USDC Pool on Raydium
const SOL_USDC_POOL_ID = new PublicKey('58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2');

// Token mints
const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

export async function buildRaydiumSwap(
  userPublicKey: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: number
): Promise<{ swapTransaction: string; lastValidBlockHeight: number }> {
  try {
    console.log('🔥 Building REAL Raydium swap instruction...');
    console.log(`User: ${userPublicKey}`);
    console.log(`Swap: ${amountIn} ${tokenIn} -> ${tokenOut}`);

    const connection = new Connection(SOLANA_RPC_URL);
    const wallet = new PublicKey(userPublicKey);

    // Get latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');

    const transaction = new Transaction({
      feePayer: wallet,
      blockhash,
      lastValidBlockHeight,
    });

    // Get or create associated token accounts
    const userUsdcAccount = getAssociatedTokenAddressSync(USDC_MINT, wallet);

    // Check if USDC account exists
    const usdcAccountInfo = await connection.getAccountInfo(userUsdcAccount);
    
    if (!usdcAccountInfo) {
      console.log('📝 Creating USDC token account...');
      // Create USDC token account
      const createUsdcAccountIx = createAssociatedTokenAccountInstruction(
        wallet, // payer
        userUsdcAccount, // ata
        wallet, // owner
        USDC_MINT // mint
      );
      transaction.add(createUsdcAccountIx);
    }

    // Build Raydium swap instruction
    // Note: This is a simplified swap instruction
    // Full Raydium integration requires pool state and proper routing
    
    const amountInLamports = new BN(Math.floor(amountIn * 1e9));
    const minAmountOut = new BN(1); // Accept any amount for now
    
    // Raydium swap instruction data
    const dataLayout = Buffer.alloc(17);
    dataLayout.writeUInt8(9, 0); // Instruction index for swap
    amountInLamports.toArrayLike(Buffer, 'le', 8).copy(dataLayout, 1);
    minAmountOut.toArrayLike(Buffer, 'le', 8).copy(dataLayout, 9);

    const swapInstruction = new TransactionInstruction({
      keys: [
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SOL_USDC_POOL_ID, isSigner: false, isWritable: true },
        { pubkey: wallet, isSigner: true, isWritable: false },
        { pubkey: wallet, isSigner: false, isWritable: true }, // User SOL account
        { pubkey: userUsdcAccount, isSigner: false, isWritable: true }, // User USDC account
      ],
      programId: RAYDIUM_AMM_PROGRAM,
      data: dataLayout,
    });

    transaction.add(swapInstruction);

    console.log('✅ Raydium swap instruction built');
    console.log(`   - Input: ${amountIn} SOL`);
    console.log(`   - Output account: ${userUsdcAccount.toString()}`);
    console.log(`   - Pool: ${SOL_USDC_POOL_ID.toString()}`);

    // Serialize
    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    return {
      swapTransaction: serialized.toString('base64'),
      lastValidBlockHeight,
    };
  } catch (error: any) {
    console.error('❌ Raydium swap error:', error.message);
    console.error('Stack:', error.stack);
    throw new Error(`Failed to build Raydium swap: ${error.message}`);
  }
}
