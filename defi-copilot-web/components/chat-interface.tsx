'use client'

import { useState, useEffect } from 'react'
import { Send, Loader2, X } from 'lucide-react'
import { SwapConfirmation } from './swap-confirmation'
import { OrderPlacement } from './order-placement'
import { CopilotLogo } from './logo'

function QueryResultCard({ intent }: { intent: any }) {
  const qr = intent?.queryResult
  if (!qr) return null

  // Portfolio
  if (qr.type === 'portfolio') {
    if (!qr.holdings?.length) return (
      <div className="mt-3 p-3 rounded-lg text-xs" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: '#999' }}>
        No token balances found in this wallet.
      </div>
    )
    return (
      <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-3 py-2 flex justify-between items-center" style={{ backgroundColor: 'var(--background)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Portfolio</span>
          <span className="text-xs font-bold" style={{ color: '#7B70FF' }}>${qr.totalUsd?.toFixed(2)}</span>
        </div>
        {qr.holdings.map((h: any, i: number) => (
          <div key={i} className="px-3 py-2 flex justify-between items-center text-xs" style={{ borderTop: '1px solid var(--border)', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
            <div>
              <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{h.symbol}</span>
              <span className="ml-2" style={{ color: '#999' }}>{h.amount?.toFixed(4)}</span>
            </div>
            <div className="text-right">
              <div style={{ color: 'var(--foreground)' }}>${h.usdValue?.toFixed(2)}</div>
              {h.change24h !== 0 && (
                <div style={{ color: h.change24h >= 0 ? '#00C9A7' : '#FF6B6B' }}>
                  {h.change24h >= 0 ? '+' : ''}{h.change24h?.toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Market
  if (qr.type === 'market') {
    return (
      <div className="mt-3 space-y-2">
        {qr.fearGreed && (
          <div className="p-3 rounded-lg flex items-center justify-between text-xs" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
            <span style={{ color: '#999' }}>Fear & Greed Index</span>
            <span className="font-bold" style={{ color: parseInt(qr.fearGreed.value) > 60 ? '#00C9A7' : parseInt(qr.fearGreed.value) < 40 ? '#FF6B6B' : '#FFB347' }}>
              {qr.fearGreed.value} — {qr.fearGreed.label}
            </span>
          </div>
        )}
        {qr.prices?.map((p: any, i: number) => (
          <div key={i} className="p-3 rounded-lg flex items-center justify-between text-xs" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              {p.image && <img src={p.image} className="w-5 h-5 rounded-full" alt={p.symbol} />}
              <div>
                <div className="font-semibold" style={{ color: 'var(--foreground)' }}>{p.symbol?.toUpperCase()}</div>
                <div style={{ color: '#999' }}>{p.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold" style={{ color: 'var(--foreground)' }}>${p.current_price?.toLocaleString()}</div>
              <div style={{ color: p.price_change_percentage_24h >= 0 ? '#00C9A7' : '#FF6B6B' }}>
                {p.price_change_percentage_24h >= 0 ? '+' : ''}{p.price_change_percentage_24h?.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
        {qr.trending?.length > 0 && (
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="px-3 py-2 text-xs font-semibold" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>🔥 Trending</div>
            {qr.trending.map((t: any, i: number) => (
              <div key={i} className="px-3 py-2 flex justify-between items-center text-xs" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  {t.thumb && <img src={t.thumb} className="w-4 h-4 rounded-full" alt={t.symbol} />}
                  <span style={{ color: 'var(--foreground)' }}>{t.name}</span>
                  <span style={{ color: '#999' }}>{t.symbol?.toUpperCase()}</span>
                </div>
                {t.rank && <span style={{ color: '#7B70FF' }}>#{t.rank}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Yield
  if (qr.type === 'yield') {
    if (!qr.pools?.length) return null
    return (
      <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-3 py-2 text-xs font-semibold" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
          Best {qr.token} Yields
        </div>
        {qr.pools.map((p: any, i: number) => (
          <div key={i} className="px-3 py-2 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border)' }}>
            <div>
              <span className="font-semibold capitalize" style={{ color: 'var(--foreground)' }}>{p.protocol}</span>
              <span className="ml-2" style={{ color: '#999' }}>{p.chain} · {p.symbol}</span>
            </div>
            <div className="text-right">
              <div className="font-bold" style={{ color: '#00C9A7' }}>{p.apy}% APY</div>
              <div style={{ color: p.risk === 'high' ? '#FF6B6B' : p.risk === 'medium' ? '#FFB347' : '#00C9A7' }}>
                {p.risk} risk · ${(p.tvl / 1e6).toFixed(1)}M TVL
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Transactions
  if (qr.type === 'transactions') {
    if (!qr.txs?.length) return (
      <div className="mt-3 p-3 rounded-lg text-xs" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: '#999' }}>
        No recent swap transactions found.
      </div>
    )
    return (
      <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-3 py-2 text-xs font-semibold" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>Recent Transactions</div>
        {qr.txs.map((tx: any, i: number) => (
          <div key={i} className="px-3 py-2 text-xs" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex justify-between">
              <span style={{ color: 'var(--foreground)' }}>{tx.description || tx.type}</span>
              <a href={`https://solscan.io/tx/${tx.signature}`} target="_blank" rel="noreferrer" className="text-xs" style={{ color: '#7B70FF' }}>View</a>
            </div>
            <div style={{ color: '#999' }}>{tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleDateString() : ''}</div>
          </div>
        ))}
      </div>
    )
  }

  return null
}

function CancelOrderCard({ order, userWallet, onCancelled }: { order: any; userWallet?: string; onCancelled: (id: string) => void }) {
  const [cancelling, setCancelling] = useState(false)

  const handleCancel = async () => {
    if (!userWallet) return alert('Wallet not connected')
    setCancelling(true)
    try {
      const txRes = await fetch(`/api/orders/${order.id}/cancel-tx?userWallet=${userWallet}`)
      if (!txRes.ok) {
        const err = await txRes.json()
        if (err.error?.includes('No Jupiter')) {
          await fetch('/api/orders/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id, userWallet }) })
          onCancelled(order.id)
          return
        }
        throw new Error(err.error || 'Failed to get cancel tx')
      }
      const { tx } = await txRes.json()
      const phantom = (window as any).phantom?.solana
      if (!phantom) throw new Error('Phantom wallet not found')
      if (!phantom.isConnected) await phantom.connect()
      const { VersionedTransaction, Connection } = await import('@solana/web3.js')
      const cancelTx = VersionedTransaction.deserialize(Buffer.from(tx, 'base64'))
      const signedTx = await phantom.signTransaction(cancelTx)
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com')
      await connection.sendRawTransaction(signedTx.serialize(), { skipPreflight: false })
      await fetch('/api/orders/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id, userWallet }) })
      onCancelled(order.id)
    } catch (e: any) {
      alert(`Cancel failed: ${e.message}`)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="rounded-lg p-3 flex items-center justify-between" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
      <div className="text-xs" style={{ color: 'var(--foreground)' }}>
        <div className="font-semibold">{order.type?.replace('_', ' ').toUpperCase()} — {order.amountIn} {order.tokenIn} → {order.tokenOut}</div>
        {order.triggerPrice && <div style={{ color: '#7B70FF' }}>Trigger: ${order.triggerPrice}</div>}
      </div>
      <button
        onClick={handleCancel}
        disabled={cancelling}
        className="ml-3 px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-40"
        style={{ backgroundColor: 'rgba(255,107,107,0.15)', color: '#FF6B6B' }}
      >
        {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
        {cancelling ? 'Cancelling...' : 'Cancel Order'}
      </button>
    </div>
  )
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  cancelOrders?: any[]
  intent?: any
  requiresConfirmation?: boolean
}

export function ChatInterface({ address, chain, initialSessionKey }: { address?: string; chain?: string; initialSessionKey?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingSwap, setPendingSwap] = useState<any>(null)
  const [pendingOrder, setPendingOrder] = useState<any>(null)
  const [jupiterQuote, setJupiterQuote] = useState<any>(null)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [currentPrice, setCurrentPrice] = useState<number | undefined>()
  // If restoring a session use its key, otherwise create a fresh one
  const [sessionKey] = useState(() => initialSessionKey || `session_${Date.now()}`)

  // Load messages if restoring an old session
  useEffect(() => {
    if (initialSessionKey && address) {
      const saved = localStorage.getItem(`chat_${address}_${initialSessionKey}`)
      if (saved) {
        try { setMessages(JSON.parse(saved)) } catch {}
      }
    }
  }, [initialSessionKey, address])

  // Auto-save messages to this session's key
  useEffect(() => {
    if (address && messages.length > 0) {
      try {
        localStorage.setItem(`chat_${address}_${sessionKey}`, JSON.stringify(messages))
        localStorage.setItem(`last_session_${address}`, sessionKey)
        // Update conversations list for sidebar Recents
        const firstUserMsg = messages.find(m => m.role === 'user')
        if (firstUserMsg) {
          const convKey = `conversations_${address}`
          const existing = JSON.parse(localStorage.getItem(convKey) || '[]')
          const updated = [
            { id: sessionKey, title: firstUserMsg.content.slice(0, 40), lastMessage: messages[messages.length - 1]?.content?.slice(0, 60) || '', timestamp: new Date().toISOString() },
            ...existing.filter((c: any) => c.id !== sessionKey),
          ].slice(0, 20) // keep max 20 conversations
          localStorage.setItem(convKey, JSON.stringify(updated))
        }
      } catch {}
    }
  }, [messages, address, sessionKey])

  const fetchSwapQuote = async (intent: any) => {
    try {
      const { createJupiterApiClient } = await import('@jup-ag/api')
      const jupiterApi = createJupiterApiClient()
      
      const TOKEN_MINTS: Record<string, string> = {
        SOL: 'So11111111111111111111111111111111111111112',
        USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      }
      
      const inputMint = TOKEN_MINTS[intent.tokenIn?.toUpperCase() || 'SOL']
      const outputMint = TOKEN_MINTS[intent.tokenOut?.toUpperCase() || 'USDC']
      const inputToken = intent.tokenIn?.toUpperCase() || 'SOL'
      const decimals = inputToken === 'SOL' ? 9 : 6
      const amount = Math.floor(parseFloat(intent.amountIn || intent.amountUsd || '0.01') * Math.pow(10, decimals))
      
      console.log('📊 Fetching Jupiter quote...', { inputMint, outputMint, amount })
      
      const quote = await jupiterApi.quoteGet({
        inputMint,
        outputMint,
        amount,
        slippageBps: 50,
      })
      
      if (quote) {
        console.log('✅ Quote received:', quote)
        setJupiterQuote(quote)
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error)
    }
  }

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

      // Handle cancel_order — show inline cancel cards instead of plain text
      if (data.intent?.action === 'cancel_order') {
        const activeOrders = data.intent?.activeOrders || []
        setMessages((prev) => [
          ...prev,
          {
            id: `cancel-cards-${Date.now()}`,
            role: 'assistant',
            content: data.reply,
            cancelOrders: activeOrders,
          },
        ])
        setLoading(false)
        return
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
          // Validate minimum amount
          const amountValue = parseFloat(data.intent.amountIn || data.intent.amountUsd || '0')
          const inputToken = data.intent.tokenIn?.toUpperCase() || 'SOL'
          
          // Minimum amounts: 0.01 SOL or 1 USDC
          const minimumAmount = inputToken === 'SOL' ? 0.01 : 1
          
          if (amountValue < minimumAmount) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: `⚠️ **Minimum Amount Required**\n\nThe minimum swap amount is:\n- **${minimumAmount} ${inputToken}**\n\nYou tried to swap **${amountValue} ${inputToken}**. Please increase the amount.`,
              },
            ])
            setLoading(false)
            return
          }
          
          // Fetch Jupiter quote immediately
          fetchSwapQuote(data.intent)
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
      <div className="flex-1 overflow-y-auto p-8 pt-20 pb-20 md:pb-8 space-y-6">
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
                {/* Query result cards (portfolio, market, yield) */}
                {message.role === 'assistant' && message.intent?.queryResult && (
                  <QueryResultCard intent={message.intent} />
                )}
                {/* Cancel order cards */}
                {message.cancelOrders && message.cancelOrders.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.cancelOrders.map((order: any) => (
                      <CancelOrderCard key={order.id} order={order} userWallet={address} onCancelled={(id) => {
                        setMessages(prev => prev.map(m => m.id === message.id
                          ? { ...m, cancelOrders: m.cancelOrders?.filter(o => o.id !== id) }
                          : m
                        ))
                      }} />
                    ))}
                  </div>
                )}
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

    </div>
  )
}
