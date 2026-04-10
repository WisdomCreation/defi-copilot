'use client'

import { useState } from 'react'
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
  onConfirm: (alwaysAllow: boolean) => void
  onCancel: () => void
}

export function SwapConfirmation({ swap, onConfirm, onCancel }: SwapConfirmationProps) {
  const [alwaysAllow, setAlwaysAllow] = useState(false)

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
              ~ {swap.estimatedOutput || '...'} {swap.tokenOut}
            </div>
          </div>

          <div className="text-xs space-y-1" style={{ color: '#999' }}>
            <div>Chain: {swap.chain}</div>
            <div>Network fee: ~$2-5</div>
          </div>
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors" style={{ backgroundColor: 'var(--hover)' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--hover)'}
          >
            <input
              type="checkbox"
              checked={alwaysAllow}
              onChange={(e) => setAlwaysAllow(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: '#FFFFFF' }}
            />
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Always allow transactions</div>
              <div className="text-xs" style={{ color: '#999' }}>
                No signature needed for future swaps (you can revoke anytime)
              </div>
            </div>
          </label>
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
            onClick={() => onConfirm(alwaysAllow)}
            className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
            style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E0E0E0'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
          >
            {alwaysAllow ? 'Sign & Always Allow' : 'Sign Once'}
          </button>
        </div>
      </div>
    </div>
  )
}
