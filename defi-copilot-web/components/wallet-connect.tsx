'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet, LogOut } from 'lucide-react'
import { useState } from 'react'

export function WalletConnect() {
  const [showModal, setShowModal] = useState(false)
  
  // EVM wallet (MetaMask, etc.)
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = () => {
    setShowModal(true)
  }

  const handleWalletConnect = (connectorIndex: number) => {
    connect({ connector: connectors[connectorIndex] })
    setShowModal(false)
  }

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm"
        style={{ 
          backgroundColor: 'var(--hover)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--sidebar)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--hover)'}
      >
        <Wallet className="w-4 h-4" />
        <span className="font-mono text-xs">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <LogOut className="w-3 h-3 opacity-60" />
      </button>
    )
  }

  return (
    <>
      <button
        onClick={handleConnect}
        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        style={{ 
          backgroundColor: '#FFFFFF',
          color: '#000000'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E0E0E0'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={() => setShowModal(false)}>
          <div className="rounded-2xl p-8 max-w-lg w-full" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Connect Wallet</h2>
            <p className="text-sm mb-6" style={{ color: '#999' }}>Available Wallets</p>
            
            <div className="space-y-3">
              {connectors.map((connector, index) => (
                <button
                  key={connector.id}
                  onClick={() => handleWalletConnect(index)}
                  className="w-full p-4 rounded-xl transition-all text-left font-medium"
                  style={{ 
                    backgroundColor: '#2A2A2A',
                    color: 'var(--foreground)',
                    border: '1px solid transparent'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#333'
                    e.currentTarget.style.borderColor = '#444'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#2A2A2A'
                    e.currentTarget.style.borderColor = 'transparent'
                  }}
                >
                  {connector.name}
                </button>
              ))}
              
              <div className="flex items-center gap-2 p-4 mt-6 rounded-xl" style={{ backgroundColor: '#0A0A0A' }}>
                <span style={{ color: '#999' }}>💡</span>
                <span className="text-sm" style={{ color: '#999' }}>Solana wallet support coming soon</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
