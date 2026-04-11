'use client'

import { X } from 'lucide-react'

interface SwapConfirmationProps {
  swap: {
    action: string
    tokenIn?: string
    tokenOut?: string
    amountIn?: string
    amountUsd?: string
    chain?: string
  }
  jupiterQuote?: any
  onConfirm: (alwaysAllow: boolean) => void
  onCancel: () => void
}

export function SwapConfirmation({ swap, jupiterQuote, onConfirm, onCancel }: SwapConfirmationProps) {

  // Calculate values from Jupiter quote
  const outputAmount = jupiterQuote 
    ? (parseFloat(jupiterQuote.outAmount) / 1e6).toFixed(2) // USDC has 6 decimals
    : '...'
  
  const networkFee = jupiterQuote?.platformFee
    ? `$${(parseFloat(jupiterQuote.platformFee.amount) / 1e9 * 170).toFixed(2)}` // Estimate SOL price
    : '~$0.01'
  
  const displayChain = swap.chain || 'solana'

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onCancel}>
      <div className="rounded-xl p-6 max-w-md w-full mx-4" style={{ backgroundColor: 'var(--sidebar)', border: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Confirm Swap</h2>
          <button onClick={onCancel} className="p-1 rounded transition-colors" style={{ color: 'var(--foreground)' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--hover)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--hover)' }}>
            <div className="text-sm mb-1" style={{ color: '#999' }}>You're swapping</div>
            <div className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
              {swap.amountIn || swap.amountUsd} {swap.tokenIn}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="text-2xl" style={{ color: '#FFFFFF' }}>↓</div>
          </div>

          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--hover)' }}>
            <div className="text-sm mb-1" style={{ color: '#999' }}>You'll receive</div>
            <div className="text-2xl font-semibold" style={{ color: '#FFFFFF' }}>
              ~ {outputAmount} {swap.tokenOut}
            </div>
          </div>

          <div className="text-xs space-y-1" style={{ color: '#999' }}>
            <div>Chain: {displayChain}</div>
            <div>Network fee: {networkFee}</div>
            {jupiterQuote && (
              <div>Price impact: {(jupiterQuote.priceImpactPct * 100).toFixed(2)}%</div>
            )}
          </div>
        </div>

        <div className="mb-6 p-3 rounded-lg" style={{ backgroundColor: 'var(--hover)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-xs" style={{ color: '#999' }}>
            <div className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>🔒 Security Notice</div>
            Every transaction requires your signature for your security. No wallet can auto-approve spending your funds.
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg transition-colors text-sm"
            style={{ backgroundColor: 'var(--hover)', color: 'var(--foreground)' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--hover)'}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
            style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E0E0E0'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
          >
            Confirm Swap
          </button>
        </div>
      </div>
    </div>
  )
}
