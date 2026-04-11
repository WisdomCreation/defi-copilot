'use client'

import { useState } from 'react'
import { X, TrendingUp, TrendingDown, Calendar, Repeat } from 'lucide-react'

interface OrderPlacementProps {
  intent: {
    action: string
    tokenIn?: string
    tokenOut?: string
    amountIn?: string
    amountUsd?: string
    triggerPrice?: string
    triggerCondition?: string
    dcaInterval?: string
    dcaCount?: number
    chain?: string
  }
  onConfirm: (signedOrder: any) => void
  onCancel: () => void
  currentPrice?: number
}

export function OrderPlacement({ intent, onConfirm, onCancel, currentPrice }: OrderPlacementProps) {
  const [loading, setLoading] = useState(false)

  const getOrderTypeDisplay = () => {
    switch (intent.action) {
      case 'limit':
        return { icon: TrendingUp, title: 'Limit Order', color: '#00C9A7' }
      case 'stop_loss':
        return { icon: TrendingDown, title: 'Stop-Loss Order', color: '#FF6B6B' }
      case 'take_profit':
        return { icon: TrendingUp, title: 'Take-Profit Order', color: '#00C9A7' }
      case 'dca':
        return { icon: Repeat, title: 'DCA Order', color: '#7B70FF' }
      default:
        return { icon: Calendar, title: 'Scheduled Order', color: '#FFB347' }
    }
  }

  const orderType = getOrderTypeDisplay()
  const Icon = orderType.icon

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const phantom = (window as any).phantom?.solana
      if (!phantom) throw new Error('Phantom wallet not found')
      if (!phantom.isConnected) await phantom.connect()

      const TOKEN_MINTS: Record<string, string> = {
        SOL: 'So11111111111111111111111111111111111111112',
        USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      }

      const inputToken = intent.tokenIn?.toUpperCase() || 'USDC'
      const outputToken = intent.tokenOut?.toUpperCase() || 'SOL'
      const inputMint = TOKEN_MINTS[inputToken]
      const outputMint = TOKEN_MINTS[outputToken]

      if (!inputMint || !outputMint) throw new Error(`Unsupported token pair: ${inputToken}/${outputToken}`)

      const inputDecimals = inputToken === 'SOL' ? 9 : 6
      const outputDecimals = outputToken === 'SOL' ? 9 : 6

      const amountValue = parseFloat(intent.amountIn || intent.amountUsd || '0')
      const makingAmount = Math.floor(amountValue * Math.pow(10, inputDecimals)).toString()

      // Calculate takingAmount from trigger price
      // e.g. sell 8 USDC, want SOL at $95 → takingAmount = 8/95 SOL = 0.0842 SOL
      const triggerPrice = parseFloat(intent.triggerPrice || '0')
      if (!triggerPrice) throw new Error('Trigger price is required')

      let takingAmount: string
      if (inputToken === 'USDC' || inputToken === 'USDT') {
        // Buying SOL: makingAmount USDC → takingAmount SOL
        const solAmount = amountValue / triggerPrice
        takingAmount = Math.floor(solAmount * Math.pow(10, outputDecimals)).toString()
      } else {
        // Selling SOL: makingAmount SOL → takingAmount USDC
        const usdcAmount = amountValue * triggerPrice
        takingAmount = Math.floor(usdcAmount * Math.pow(10, outputDecimals)).toString()
      }

      console.log('🎯 Creating Jupiter Trigger Order...', { inputMint, outputMint, makingAmount, takingAmount })

      // Step 1: Get transaction from Jupiter Trigger API
      const response = await fetch('https://api.jup.ag/trigger/v1/createOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_JUPITER_API_KEY || '',
        },
        body: JSON.stringify({
          inputMint,
          outputMint,
          maker: phantom.publicKey.toString(),
          makingAmount,
          takingAmount,
          expiredAt: null, // No expiry
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || `Jupiter API error: ${response.status}`)
      }

      const { transaction, order } = await response.json()

      // Step 2: User signs the transaction with Phantom
      const { VersionedTransaction, Connection } = await import('@solana/web3.js')
      const txBuffer = Buffer.from(transaction, 'base64')
      const tx = VersionedTransaction.deserialize(txBuffer)

      console.log('🔐 Requesting signature from Phantom...')
      const signedTx = await phantom.signTransaction(tx)

      // Step 3: Broadcast to Solana network
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com'
      )
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      })

      console.log('✅ Jupiter limit order placed on-chain:', signature)
      console.log('📋 Order key:', order)

      // Step 4: Save to our backend for tracking
      const orderData = {
        userWallet: phantom.publicKey.toString(),
        type: intent.action,
        tokenIn: inputToken,
        tokenOut: outputToken,
        amountIn: amountValue.toString(),
        triggerPrice: intent.triggerPrice,
        triggerCondition: intent.triggerCondition,
        chain: 'solana',
        signedTx: null,
        jupiterOrderKey: order, // Store Jupiter's order key for tracking
        txHash: signature,
        dcaInterval: intent.dcaInterval,
        dcaMaxExecutions: intent.dcaCount,
      }

      onConfirm(orderData)
    } catch (error: any) {
      console.error('Order creation error:', error)
      alert(`Failed to create order: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onCancel}
    >
      <div
        className="rounded-xl p-6 max-w-md w-full mx-4"
        style={{ backgroundColor: 'var(--sidebar)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${orderType.color}15` }}
            >
              <Icon className="w-5 h-5" style={{ color: orderType.color }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                {orderType.title}
              </h2>
              <div className="text-xs" style={{ color: '#999' }}>
                Sign once, execute automatically
              </div>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--foreground)' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Details */}
        <div className="space-y-4 mb-6">
          {/* Trade Info */}
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--hover)' }}>
            <div className="text-sm mb-1" style={{ color: '#999' }}>
              You're setting up
            </div>
            <div className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              {intent.amountIn || intent.amountUsd} {intent.tokenIn} → {intent.tokenOut}
            </div>
          </div>

          {/* Trigger Condition */}
          {intent.triggerPrice && (
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: 'rgba(83,74,183,0.1)', border: '1px solid rgba(83,74,183,0.3)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm" style={{ color: '#999' }}>
                  Trigger Price
                </div>
                {currentPrice && (
                  <div className="text-xs" style={{ color: '#999' }}>
                    Current: ${currentPrice.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="text-xl font-bold" style={{ color: '#7B70FF' }}>
                ${intent.triggerPrice} {intent.triggerCondition}
              </div>
            </div>
          )}

          {/* DCA Info */}
          {intent.dcaInterval && (
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: 'rgba(0,201,167,0.1)', border: '1px solid rgba(0,201,167,0.3)' }}
            >
              <div className="text-sm mb-1" style={{ color: '#999' }}>
                Recurring
              </div>
              <div className="text-lg font-semibold" style={{ color: '#00C9A7' }}>
                {intent.dcaInterval} × {intent.dcaCount} times
              </div>
            </div>
          )}

          {/* How It Works */}
          <div className="text-xs space-y-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--background)' }}>
            <div style={{ color: 'var(--foreground)' }} className="font-medium">
              How it works:
            </div>
            <div style={{ color: '#999' }}>
              1. Sign once now → order placed on Solana blockchain
              <br />
              2. Jupiter's keepers monitor price 24/7
              <br />
              3. Auto-executes when price hits target
              <br />
              4. No second signature needed
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div
          className="mb-6 p-3 rounded-lg"
          style={{ backgroundColor: 'var(--hover)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="text-xs" style={{ color: '#999' }}>
            <div className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>
              🔒 Security
            </div>
            Order is placed on-chain via Jupiter. Only you can cancel it. Auto-executes when price triggers.
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-lg transition-colors text-sm font-medium"
            style={{ backgroundColor: 'var(--hover)', color: 'var(--foreground)' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--background)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover)')}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg transition-colors font-medium text-sm"
            style={{
              backgroundColor: loading ? '#666' : orderType.color,
              color: '#000000',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.opacity = '0.9'
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.opacity = '1'
            }}
          >
            {loading ? 'Placing Order...' : 'Sign & Place Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
