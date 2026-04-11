'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { MessageSquare, FileText, Code } from 'lucide-react'
import { WalletConnect } from '@/components/wallet-connect'
import { ChatHistory } from '@/components/chat-history'
import { ChatInterface } from '@/components/chat-interface'
import { OrderDashboard } from '@/components/order-dashboard'

export default function Home() {
  const { address, chain } = useAccount()
  const [currentSection, setCurrentSection] = useState('chats')
  const [chatKey, setChatKey] = useState(0)
  const [solanaAddress, setSolanaAddress] = useState<string | undefined>()
  const [activeSessionKey, setActiveSessionKey] = useState<string | undefined>()
  
  const chainName = chain?.name.toLowerCase() || 'ethereum'

  // Get Phantom Solana wallet address
  useEffect(() => {
    const getPhantomAddress = async () => {
      const phantom = (window as any).phantom?.solana
      if (phantom) {
        try {
          if (!phantom.isConnected) {
            await phantom.connect({ onlyIfTrusted: true })
          }
          if (phantom.publicKey) {
            setSolanaAddress(phantom.publicKey.toString())
          }
        } catch {
          // Not connected yet, that's ok
        }
      }
    }
    getPhantomAddress()
    // Listen for Phantom connect events
    const phantom = (window as any).phantom?.solana
    if (phantom) {
      phantom.on?.('connect', (publicKey: any) => setSolanaAddress(publicKey.toString()))
      phantom.on?.('disconnect', () => setSolanaAddress(undefined))
    }
  }, [])

  const handleNewChat = () => {
    setActiveSessionKey(undefined) // clear selected session → fresh chat
    setChatKey(prev => prev + 1)
  }

  const handleSelectConversation = (sessionKey: string) => {
    setActiveSessionKey(sessionKey)
    setChatKey(prev => prev + 1) // remount ChatInterface with new session
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Chat History Sidebar */}
      <div className="w-64 hidden md:block border-r" style={{ borderColor: 'var(--border)', position: 'relative', zIndex: 50 }}>
        <ChatHistory 
          onNavigate={setCurrentSection}
          currentSection={currentSection}
          onNewChat={handleNewChat}
          userAddress={solanaAddress || address}
          onSelectConversation={handleSelectConversation}
          activeSessionKey={activeSessionKey}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Floating Wallet Button */}
        <div className="fixed top-4 right-4" style={{ zIndex: 30 }}>
          <WalletConnect />
        </div>

        {/* Content based on selected section */}
        {currentSection === 'chats' && (
          <ChatInterface key={chatKey} address={solanaAddress || address} chain={chainName} initialSessionKey={activeSessionKey} />
        )}
        
        {currentSection === 'trades' && (
          <div className="flex-1 flex items-center justify-center p-8">
            {solanaAddress ? (
              <div className="w-full max-w-6xl">
                <OrderDashboard
                  userWallet={solanaAddress}
                  onClose={() => setCurrentSection('chats')}
                  embedded={true}
                />
              </div>
            ) : (
              <div className="text-center" style={{ color: '#999' }}>
                <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Trades</h2>
                <p>Connect your Phantom wallet to view and manage trades</p>
              </div>
            )}
          </div>
        )}

        {currentSection === 'portfolio' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center" style={{ color: '#999' }}>
              <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Portfolio</h2>
              <p>Coming soon...</p>
            </div>
          </div>
        )}

        {currentSection === 'settings' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center" style={{ color: '#999' }}>
              <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Settings</h2>
              <p>Coming soon...</p>
            </div>
          </div>
        )}

        {currentSection === 'search' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center" style={{ color: '#999' }}>
              <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Search</h2>
              <p>Coming soon...</p>
            </div>
          </div>
        )}
        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 flex border-t" style={{ backgroundColor: 'var(--sidebar)', borderColor: 'var(--border)', zIndex: 40 }}>
          {[
            { id: 'chats', label: 'Chats', icon: MessageSquare },
            { id: 'trades', label: 'Trades', icon: FileText },
            { id: 'portfolio', label: 'Portfolio', icon: Code },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentSection(id)}
              className="flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors"
              style={{ color: currentSection === id ? 'var(--foreground)' : '#666' }}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
