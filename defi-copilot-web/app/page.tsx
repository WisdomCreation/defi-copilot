'use client'

import { useAccount } from 'wagmi'
import { WalletConnect } from '@/components/wallet-connect'
import { ChatHistory } from '@/components/chat-history'
import { ChatInterface } from '@/components/chat-interface'

export default function Home() {
  const { address, chain } = useAccount()
  
  const chainName = chain?.name.toLowerCase() || 'ethereum'

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Chat History Sidebar */}
      <div className="w-64 hidden md:block border-r" style={{ borderColor: 'var(--border)' }}>
        <ChatHistory />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Floating Wallet Button */}
        <div className="fixed top-4 right-4" style={{ zIndex: 40 }}>
          <WalletConnect />
        </div>

        {/* Chat Interface */}
        <ChatInterface address={address} chain={chainName} />
      </div>
    </div>
  );
}
