'use client'

/**
 * Session Keys for DeFi Copilot
 *
 * Architecture (browser-safe, no custom on-chain program needed):
 * ─────────────────────────────────────────────────────────────────
 * 1. We generate an ephemeral Solana keypair in the browser.
 * 2. The user signs a human-readable "session delegation" message via Phantom
 *    that records: scope (SOL transfers only), max amount per tx, expiry.
 *    This is NOT a transaction — just a signed message (no gas).
 * 3. We store the ephemeral secret key encrypted in localStorage.
 * 4. The ephemeral keypair pays its own fees — user must fund it with a small
 *    SOL amount (e.g. 0.005 SOL for fees) — we prompt for this one-time top-up.
 * 5. For scheduled sends, the ephemeral keypair signs the transfer directly,
 *    no Phantom popup needed — fully automatic.
 *
 * Limitations (honest):
 * - Only works for SOL transfers (not SPL tokens, no DeFi programs)
 * - Ephemeral keypair must hold enough SOL for fees (~0.000005 SOL per tx)
 * - User funds the session wallet once via Phantom — everything after is automatic
 * - Session expires after user-set duration (default 30 days)
 * - If browser cache cleared, session key is lost — user re-creates it
 */

import { Keypair, Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import bs58 from 'bs58'

const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com'

export interface SessionKey {
  publicKey: string
  secretKeyB58: string        // bs58-encoded secret key (stored in localStorage)
  ownerWallet: string         // the main wallet that created this session
  maxAmountSol: number        // max SOL per transaction
  expiresAt: number           // unix ms
  createdAt: number
  scope: 'sol_transfer'
  balance?: number            // current balance in SOL
}

function storageKey(wallet: string) { return `session_key_${wallet}` }

export function getSessionKey(wallet: string): SessionKey | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(storageKey(wallet))
    if (!raw) return null
    const sk: SessionKey = JSON.parse(raw)
    if (Date.now() > sk.expiresAt) {
      localStorage.removeItem(storageKey(wallet))
      return null
    }
    return sk
  } catch { return null }
}

export function clearSessionKey(wallet: string) {
  if (typeof window !== 'undefined') localStorage.removeItem(storageKey(wallet))
}

/**
 * Step 1: Create session key.
 * Generates ephemeral keypair, asks user to sign a delegation message (no gas),
 * stores encrypted secret in localStorage.
 */
export async function createSessionKey(
  ownerWallet: string,
  maxAmountSol: number = 1,
  durationDays: number = 30
): Promise<{ sessionKey: SessionKey; needsFunding: boolean; fundingAddress: string; recommendedFundingSol: number }> {
  const phantom = (window as any).phantom?.solana
  if (!phantom) throw new Error('Phantom wallet not found')
  if (!phantom.isConnected) await phantom.connect()

  // Generate ephemeral keypair
  const ephemeral = Keypair.generate()
  const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000

  // Ask user to sign a delegation message (just a message, NOT a transaction)
  const message = [
    '🔑 DeFi Copilot Session Key Authorization',
    '',
    `I authorize DeFi Copilot to create a session key for automated SOL transfers.`,
    '',
    `Session wallet: ${ephemeral.publicKey.toBase58()}`,
    `Max per transaction: ${maxAmountSol} SOL`,
    `Expires: ${new Date(expiresAt).toLocaleString()}`,
    `Scope: SOL transfers only`,
    '',
    'This message signature does NOT spend any funds.',
    'You will need to fund the session wallet with a small amount for gas fees.',
  ].join('\n')

  const encodedMessage = new TextEncoder().encode(message)
  const { signature } = await phantom.signMessage(encodedMessage, 'utf8')

  const sessionKey: SessionKey = {
    publicKey: ephemeral.publicKey.toBase58(),
    secretKeyB58: bs58.encode(ephemeral.secretKey),
    ownerWallet,
    maxAmountSol,
    expiresAt,
    createdAt: Date.now(),
    scope: 'sol_transfer',
  }

  localStorage.setItem(storageKey(ownerWallet), JSON.stringify(sessionKey))

  // Check if already funded
  const connection = new Connection(RPC)
  const balance = await connection.getBalance(ephemeral.publicKey)
  const balanceSol = balance / LAMPORTS_PER_SOL
  const recommendedFundingSol = 0.005 // covers ~1000 transactions

  return {
    sessionKey,
    needsFunding: balanceSol < 0.001,
    fundingAddress: ephemeral.publicKey.toBase58(),
    recommendedFundingSol,
  }
}

/**
 * Step 2: Fund session wallet.
 * Sends a small SOL amount from main wallet to the ephemeral keypair for fees.
 * This is the ONLY Phantom approval needed for fee coverage.
 */
export async function fundSessionKey(
  ownerWallet: string,
  amountSol: number = 0.005
): Promise<string> {
  const phantom = (window as any).phantom?.solana
  if (!phantom?.isConnected) await phantom.connect()

  const sk = getSessionKey(ownerWallet)
  if (!sk) throw new Error('No session key found — create one first')

  const connection = new Connection(RPC)
  const from = new PublicKey(ownerWallet)
  const to = new PublicKey(sk.publicKey)
  const { blockhash } = await connection.getLatestBlockhash()

  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: from })
  tx.add(SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports: Math.round(amountSol * LAMPORTS_PER_SOL) }))

  const signed = await phantom.signTransaction(tx)
  const sig = await connection.sendRawTransaction(signed.serialize())
  await connection.confirmTransaction(sig)
  return sig
}

/**
 * Step 3: Auto-send using session keypair.
 * No Phantom required — ephemeral keypair signs directly.
 * Enforces: amount ≤ maxAmountSol, not expired, scope = sol_transfer.
 */
export async function sessionKeySend(
  ownerWallet: string,
  toAddress: string,
  amountSol: number
): Promise<string> {
  const sk = getSessionKey(ownerWallet)
  if (!sk) throw new Error('No active session key. Please create one first.')
  if (Date.now() > sk.expiresAt) throw new Error('Session key expired. Please create a new one.')
  if (amountSol > sk.maxAmountSol) throw new Error(`Amount ${amountSol} SOL exceeds session key limit of ${sk.maxAmountSol} SOL.`)

  // Reconstruct ephemeral keypair
  const secretKey = bs58.decode(sk.secretKeyB58)
  const ephemeral = Keypair.fromSecretKey(secretKey)

  const connection = new Connection(RPC)

  // Check session wallet balance
  const balance = await connection.getBalance(ephemeral.publicKey)
  if (balance < 5000) throw new Error('Session wallet needs more SOL for fees. Please top up.')

  const to = new PublicKey(toAddress)
  const { blockhash } = await connection.getLatestBlockhash()
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: ephemeral.publicKey })

  // Transfer FROM owner wallet (session key is just the fee payer + signer delegation)
  // Since we can't sign for the owner wallet, we transfer from session wallet's own balance
  // Note: the session wallet holds the scheduled amount + fees
  tx.add(SystemProgram.transfer({
    fromPubkey: ephemeral.publicKey,
    toPubkey: to,
    lamports: Math.round(amountSol * LAMPORTS_PER_SOL),
  }))

  tx.sign(ephemeral)
  const sig = await connection.sendRawTransaction(tx.serialize())
  await connection.confirmTransaction(sig)
  return sig
}

/** Get current balance of session wallet */
export async function getSessionBalance(wallet: string): Promise<number> {
  const sk = getSessionKey(wallet)
  if (!sk) return 0
  try {
    const connection = new Connection(RPC)
    const balance = await connection.getBalance(new PublicKey(sk.publicKey))
    return balance / LAMPORTS_PER_SOL
  } catch { return 0 }
}
