'use client'

import { MessageSquare, Plus, Search, Settings, Code, FileText } from 'lucide-react'
import { CopilotLogoSmall } from './logo'

interface Conversation {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
}

interface ChatHistoryProps {
  onNavigate?: (section: string) => void
  currentSection?: string
  onClearHistory?: () => void
}

export function ChatHistory({ onNavigate, currentSection = 'chats', onClearHistory }: ChatHistoryProps) {
  const conversations: Conversation[] = []

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--sidebar)' }}>
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <CopilotLogoSmall size={32} />
        <span className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>DeFi Copilot</span>
      </div>

      {/* New Chat Button */}
      <div className="px-3 mb-4">
        <button 
          onClick={onClearHistory}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm"
          style={{ 
            backgroundColor: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--foreground)'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--hover)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Plus className="w-4 h-4" />
          New chat
        </button>
      </div>

      {/* Navigation */}
      <div className="px-3 space-y-1 mb-4">
        <button 
          onClick={() => onNavigate?.('search')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm"
          style={{ 
            color: 'var(--foreground)',
            backgroundColor: currentSection === 'search' ? 'var(--hover)' : 'transparent'
          }}
          onMouseOver={(e) => currentSection !== 'search' && (e.currentTarget.style.backgroundColor = 'var(--hover)')}
          onMouseOut={(e) => currentSection !== 'search' && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Search className="w-4 h-4" />
          Search
        </button>
        <button 
          onClick={() => onNavigate?.('settings')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm"
          style={{ 
            color: 'var(--foreground)',
            backgroundColor: currentSection === 'settings' ? 'var(--hover)' : 'transparent'
          }}
          onMouseOver={(e) => currentSection !== 'settings' && (e.currentTarget.style.backgroundColor = 'var(--hover)')}
          onMouseOut={(e) => currentSection !== 'settings' && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Section Divider */}
      <div className="px-3 mb-2">
        <div style={{ height: '1px', backgroundColor: 'var(--border)' }}></div>
      </div>

      {/* Main Navigation */}
      <div className="px-3 space-y-1">
        <button 
          onClick={() => onNavigate?.('chats')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm"
          style={{ 
            color: 'var(--foreground)',
            backgroundColor: currentSection === 'chats' ? 'var(--hover)' : 'transparent'
          }}
          onMouseOver={(e) => currentSection !== 'chats' && (e.currentTarget.style.backgroundColor = 'var(--hover)')}
          onMouseOut={(e) => currentSection !== 'chats' && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <MessageSquare className="w-4 h-4" />
          Chats
        </button>
        <button 
          onClick={() => onNavigate?.('trades')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm"
          style={{ 
            color: 'var(--foreground)',
            backgroundColor: currentSection === 'trades' ? 'var(--hover)' : 'transparent'
          }}
          onMouseOver={(e) => currentSection !== 'trades' && (e.currentTarget.style.backgroundColor = 'var(--hover)')}
          onMouseOut={(e) => currentSection !== 'trades' && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <FileText className="w-4 h-4" />
          Trades
        </button>
        <button 
          onClick={() => onNavigate?.('portfolio')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm"
          style={{ 
            color: 'var(--foreground)',
            backgroundColor: currentSection === 'portfolio' ? 'var(--hover)' : 'transparent'
          }}
          onMouseOver={(e) => currentSection !== 'portfolio' && (e.currentTarget.style.backgroundColor = 'var(--hover)')}
          onMouseOut={(e) => currentSection !== 'portfolio' && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Code className="w-4 h-4" />
          Portfolio
        </button>
      </div>

      {/* Recents */}
      <div className="flex-1 overflow-y-auto px-3 mt-4">
        <div className="text-xs mb-2 px-3" style={{ color: '#999' }}>Recents</div>
        {conversations.length === 0 ? (
          <div className="text-xs px-3 mt-4" style={{ color: '#666' }}>
            No recent chats
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                className="w-full text-left px-3 py-2 rounded-lg transition-colors text-sm"
                style={{ color: 'var(--foreground)' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--hover)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="truncate">{conv.title}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
