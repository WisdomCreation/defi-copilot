'use client'

import { useState } from 'react'
import { Send, Loader2, List } from 'lucide-react'
import { SwapConfirmation } from './swap-confirmation'
import { OrderPlacement } from './order-placement'
import { OrderDashboard } from './order-dashboard'
import { CopilotLogo } from './logo'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  intent?: any
  requiresConfirmation?: boolean
}

export function ChatInterface({ address, chain }: { address?: string; chain?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingSwap, setPendingSwap] = useState<any>(null)
  const [pendingOrder, setPendingOrder] = useState<any>(null)
  const [jupiterQuote, setJupiterQuote] = useState<any>(null)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [showOrderDashboard, setShowOrderDashboard] = useState(false)
  const [currentPrice, setCurrentPrice] = useState<number | undefined>()

  const sendMessage = async () => {
    if (!input.trim() || loading || !address) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    setMessages([...messages, newMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          walletAddress: address,
          chain: chain || 'solana',
          conversationId: conversationId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from copilot')
      }

      const data = await response.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        intent: data.intent,
        requiresConfirmation: data.requiresConfirmation,
      }

      setMessages((prev) => [...prev, aiMessage])
      
      // Save conversation ID for future messages
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
      }
      
      if (data.requiresConfirmation && data.intent) {
        const action = data.intent.action
        
        // Determine if it's a swap or an order
        if (action === 'swap') {
          setPendingSwap(data.intent)
        } else if (['limit', 'stop_loss', 'take_profit', 'dca'].includes(action)) {
          setPendingOrder(data.intent)
          
          // Fetch current price for display
          if (data.intent.tokenOut) {
            try {
              const priceResponse = await fetch(`/api/price/${data.intent.tokenOut}`)
              const priceData = await priceResponse.json()
              setCurrentPrice(priceData.price)
            } catch (e) {
              console.error('Failed to fetch price:', e)
            }
          }
        }
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleSwapConfirm = async (alwaysAllow: boolean) => {
    if (!pendingSwap || !address) return
    
    setLoading(true)
    try {
      // Get Phantom wallet
      const phantom = (window as any).phantom?.solana
      if (!phantom) {
        throw new Error('Phantom wallet not found. Please install Phantom.')
      }

      // Connect if not already
      if (!phantom.isConnected) {
        await phantom.connect()
      }

      // Get swap transaction from backend
      const txResponse = await fetch('/api/swap/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteData: pendingSwap.quoteData,
          userPublicKey: phantom.publicKey.toString(),
        }),
      })

      if (!txResponse.ok) {
        throw new Error('Failed to build transaction')
      }

      // Use backend as proxy to avoid CORS issues
      const { Connection, VersionedTransaction } = await import('@solana/web3.js')
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com'
      )

      console.log('Executing swap via backend proxy:', {
        tokenIn: pendingSwap.tokenIn,
        tokenOut: pendingSwap.tokenOut,
        amountIn: pendingSwap.amountIn
      })

      // REAL JUPITER SWAP - Client-side to bypass network blocks
      console.log('🔥 Building REAL Jupiter swap client-side...')
      
      const { createJupiterApiClient } = await import('@jup-ag/api')
      const jupiterApi = createJupiterApiClient()
      
      const TOKEN_MINTS: Record<string, string> = {
        SOL: 'So11111111111111111111111111111111111111112',
        USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      }
      
      const inputMint = TOKEN_MINTS[pendingSwap.tokenIn?.toUpperCase() || 'SOL']
      const outputMint = TOKEN_MINTS[pendingSwap.tokenOut?.toUpperCase() || 'USDC']
      const amount = Math.floor(parseFloat(pendingSwap.amountIn || '0.01') * 1e9)
      
      console.log('Getting Jupiter quote:', { inputMint, outputMint, amount })
      
      // Get best swap route from Jupiter
      const quote = await jupiterApi.quoteGet({
        inputMint,
        outputMint,
        amount,
        slippageBps: 50, // 0.5% slippage
      })
      
      if (!quote) {
        throw new Error('No route found for this swap')
      }
      
      console.log('✅ Jupiter quote received:', quote)
      
      // Store quote for display
      setJupiterQuote(quote)
      
      // Get swap transaction
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
      
      console.log('✅ Jupiter swap transaction built!')
      
      const swapTransaction = swapResult.swapTransaction

      // Deserialize transaction
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf)

      // Sign transaction
      const signedTx = await phantom.signTransaction(transaction)

      // Send transaction
      const rawTransaction = signedTx.serialize()
      const signature = await connection.sendRawTransaction(rawTransaction)

      // Wait for confirmation
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Transaction sent! Waiting for confirmation...',
        },
      ])

      await connection.confirmTransaction(signature, 'confirmed')

      // Success!
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ **SWAP EXECUTED!**\n\n` +
            `Your ${pendingSwap.tokenIn} → ${pendingSwap.tokenOut} swap completed successfully!\n\n` +
            `**Transaction:** https://solscan.io/tx/${signature}\n\n` +
            `Check your wallet - your tokens should arrive within seconds! 🎉`,
        },
      ])
      
      setPendingSwap(null)
    } catch (error: any) {
      console.error('Swap error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Swap failed: ${error.message || 'Unknown error'}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleOrderConfirm = async (orderData: any) => {
    setLoading(true)
    try {
      // Create order on backend
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order')
      }

      // Success!
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ **ORDER CREATED!**\n\n` +
            `Your ${orderData.type.replace('_', ' ')} order is now active!\n\n` +
            `**Order ID:** ${data.order.id}\n` +
            `**Trade:** ${orderData.amountIn} ${orderData.tokenIn} → ${orderData.tokenOut}\n\n` +
            `I'll monitor the market 24/7 and execute automatically when triggered. Check "My Orders" to track status.`,
        },
      ])

      setPendingOrder(null)
      setCurrentPrice(undefined)
    } catch (error: any) {
      console.error('Order creation error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Failed to create order: ${error.message || 'Unknown error'}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    if (hour < 22) return 'Good evening'
    return "It's late-night"
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--background)' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 pt-20 space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-2xl w-full px-4">
              <div className="mb-8 flex justify-center">
                <CopilotLogo size={48} />
              </div>
              <h1 className="greeting-text text-3xl md:text-4xl mb-12" style={{ color: 'var(--foreground)' }}>
                {getGreeting()} {address ? address.slice(0, 6) : 'Trader'}
              </h1>
              
              {/* Centered Input Box */}
              <div className="max-w-2xl mx-auto mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="How can I help you today?"
                    className="w-full rounded-xl px-5 py-4 pr-12 focus:outline-none text-base"
                    style={{
                      backgroundColor: 'var(--hover)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)'
                    }}
                    disabled={loading || !address}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim() || !address}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors disabled:opacity-30"
                    style={{
                      color: 'var(--foreground)'
                    }}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--hover)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <span>💹</span> Trade
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--hover)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <span>📊</span> Analyze
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--hover)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <span>🔍</span> Research
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--hover)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <span>💼</span> Portfolio
                </button>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-5 py-3 text-sm ${
                  message.role === 'user'
                    ? 'text-black'
                    : ''
                }`}
                style={{
                  backgroundColor: message.role === 'user' ? '#FFFFFF' : 'var(--hover)',
                  color: message.role === 'user' ? '#000000' : 'var(--foreground)'
                }}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl px-5 py-3 flex items-center gap-2" style={{ backgroundColor: 'var(--hover)', color: 'var(--foreground)' }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input - Only show when messages exist */}
      {messages.length > 0 && (
        <div className="p-6" style={{ borderTop: '1px solid var(--border)' }}>
          {!address ? (
            <div className="text-center py-3 text-sm" style={{ color: '#999' }}>
              Please connect your wallet to start trading
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about swaps, portfolio, or DeFi strategies..."
                  className="w-full rounded-xl px-4 py-3 pr-12 focus:outline-none text-sm"
                  style={{
                    backgroundColor: 'var(--hover)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)'
                  }}
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors disabled:opacity-30"
                  style={{
                    color: 'var(--foreground)'
                  }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* My Orders Button - Fixed Position */}
      {address && messages.length > 0 && (
        <button
          onClick={() => setShowOrderDashboard(true)}
          className="fixed bottom-24 right-6 p-4 rounded-full shadow-lg transition-all hover:scale-105"
          style={{
            backgroundColor: '#7B70FF',
            color: '#fff',
            border: '2px solid rgba(255,255,255,0.2)',
          }}
        >
          <List className="w-5 h-5" />
        </button>
      )}

      {/* Swap Confirmation Modal */}
      {pendingSwap && (
        <SwapConfirmation
          swap={pendingSwap}
          jupiterQuote={jupiterQuote}
          onConfirm={handleSwapConfirm}
          onCancel={() => {
            setPendingSwap(null)
            setJupiterQuote(null)
          }}
        />
      )}

      {/* Order Placement Modal */}
      {pendingOrder && (
        <OrderPlacement
          intent={pendingOrder}
          currentPrice={currentPrice}
          onConfirm={handleOrderConfirm}
          onCancel={() => {
            setPendingOrder(null)
            setCurrentPrice(undefined)
          }}
        />
      )}

      {/* Order Dashboard Modal */}
      {showOrderDashboard && (
        <OrderDashboard
          userWallet={address}
          onClose={() => setShowOrderDashboard(false)}
        />
      )}
    </div>
  )
}
