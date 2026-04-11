'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { MessageSquare, FileText, Code } from 'lucide-react'
import { WalletConnect } from '@/components/wallet-connect'
import { ChatHistory } from '@/components/chat-history'
import { ChatInterface } from '@/components/chat-interface'
import { OrderDashboard } from '@/components/order-dashboard'

export default function Home() {
  const { address, chain } = useAccount()
  const [currentSection, setCurrentSection] = useState('chats')
  const [chatKey, setChatKey] = useState(0) // Force re-render of chat interface
  
  const chainName = chain?.name.toLowerCase() || 'ethereum'

  const handleNewChat = () => {
    if (address) {
      // Just start a fresh chat by re-mounting the component
      // The chat interface will auto-save the current conversation
      setChatKey(prev => prev + 1)
    }
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Chat History Sidebar */}
      <div className="w-64 hidden md:block border-r" style={{ borderColor: 'var(--border)', position: 'relative', zIndex: 50 }}>
        <ChatHistory 
          onNavigate={setCurrentSection}
          currentSection={currentSection}
          onNewChat={handleNewChat}
          userAddress={address}
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
          <ChatInterface key={chatKey} address={address} chain={chainName} />
        )}
        
        {currentSection === 'trades' && (
          <div className="flex-1 flex items-center justify-center p-8">
            {address ? (
              <div className="w-full max-w-6xl">
                <OrderDashboard
                  userWallet={address}
                  onClose={() => setCurrentSection('chats')}
                  embedded={true}
                />
              </div>
            ) : (
              <div className="text-center" style={{ color: '#999' }}>
                <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Trades</h2>
                <p>Connect your wallet to view and manage trades</p>
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
