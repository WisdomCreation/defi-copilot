'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { WalletConnect } from '@/components/wallet-connect'
import { ChatHistory } from '@/components/chat-history'
import { ChatInterface } from '@/components/chat-interface'
import { OrderDashboard } from '@/components/order-dashboard'

export default function Home() {
  const { address, chain } = useAccount()
  const [currentSection, setCurrentSection] = useState('chats')
  
  const chainName = chain?.name.toLowerCase() || 'ethereum'

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Chat History Sidebar */}
      <div className="w-64 hidden md:block border-r" style={{ borderColor: 'var(--border)' }}>
        <ChatHistory 
          onNavigate={setCurrentSection}
          currentSection={currentSection}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Floating Wallet Button */}
        <div className="fixed top-4 right-4" style={{ zIndex: 40 }}>
          <WalletConnect />
        </div>

        {/* Content based on selected section */}
        {currentSection === 'chats' && (
          <ChatInterface address={address} chain={chainName} />
        )}
        
        {currentSection === 'trades' && address && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-6xl">
              <OrderDashboard 
                userWallet={address}
                onClose={() => setCurrentSection('chats')}
                embedded={true}
              />
            </div>
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
      </div>
    </div>
  );
}
