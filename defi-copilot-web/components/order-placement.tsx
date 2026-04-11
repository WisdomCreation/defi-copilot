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
      if (!phantom) {
        throw new Error('Phantom wallet not found')
      }

      // Import Jupiter API
      const { createJupiterApiClient } = await import('@jup-ag/api')
      const jupiterApi = createJupiterApiClient()

      const TOKEN_MINTS: Record<string, string> = {
        SOL: 'So11111111111111111111111111111111111111112',
        USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      }

      const inputMint = TOKEN_MINTS[intent.tokenIn?.toUpperCase() || 'USDC']
      const outputMint = TOKEN_MINTS[intent.tokenOut?.toUpperCase() || 'SOL']
      
      // Get correct decimals for input token
      const inputToken = intent.tokenIn?.toUpperCase() || 'USDC'
      const decimals = inputToken === 'SOL' ? 9 : 6 // SOL=9, USDC/USDT=6
      const amountValue = parseFloat(intent.amountIn || intent.amountUsd || '0')
      const amount = Math.floor(amountValue * Math.pow(10, decimals))

      console.log('Building order transaction...', { 
        inputMint, 
        outputMint, 
        amount, 
        amountValue,
        decimals,
        inputToken
      })

      // Get Jupiter quote
      const quote = await jupiterApi.quoteGet({
        inputMint,
        outputMint,
        amount,
        slippageBps: 50,
      })

      if (!quote) {
        throw new Error('No route found')
      }

      // Build transaction
      const swapResult = await jupiterApi.swapPost({
        swapRequest: {
          quoteResponse: quote,
          userPublicKey: phantom.publicKey.toString(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              maxLamports: 10000000,
              priorityLevel: 'high',
            },
          },
        },
      })

      const swapTransaction = swapResult.swapTransaction

      // Deserialize transaction
      const { VersionedTransaction } = await import('@solana/web3.js')
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf)

      console.log('🔐 Requesting signature for order...')

      // User signs the transaction NOW
      const signedTx = await phantom.signTransaction(transaction)

      console.log('✅ Transaction signed!')

      // Send signed transaction to backend for storage
      const orderData = {
        userWallet: phantom.publicKey.toString(),
        type: intent.action,
        tokenIn: intent.tokenIn || 'USDC',
        tokenOut: intent.tokenOut || 'SOL',
        amountIn: intent.amountIn || intent.amountUsd || '0',
        triggerPrice: intent.triggerPrice,
        triggerCondition: intent.triggerCondition,
        chain: intent.chain || 'solana',
        signedTx: Buffer.from(signedTx.serialize()).toString('base64'),
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
              1. You sign the transaction once (right now)
              <br />
              2. We monitor the price 24/7 on our server
              <br />
              3. When triggered, we execute automatically
              <br />
              4. You get notified when it fills
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
            Your signed transaction is locked to this exact trade. We cannot modify the destination or amount.
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
            {loading ? 'Signing...' : 'Sign & Create Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
