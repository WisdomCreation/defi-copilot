'use client'

import { useState, useEffect } from 'react'
import { Send, Loader2, X, UserPlus, Trash2, Edit2, Check } from 'lucide-react'
import { SwapConfirmation } from './swap-confirmation'
import { OrderPlacement } from './order-placement'
import { CopilotLogo } from './logo'
import { getContacts, saveContact, deleteContact, resolveContact, resolveContacts, type Contact } from '../hooks/useContacts'
import { saveScheduledPayment, getScheduledPayments, cancelScheduledPayment, updateScheduledPayment, parseScheduleDate, type ScheduledPayment } from '../hooks/useScheduledPayments'
import { getSessionKey, createSessionKey, fundSessionKey, sessionKeySend, getSessionBalance, type SessionKey } from '../hooks/useSessionKey'

function QueryResultCard({ intent, userAddress }: { intent: any; userAddress?: string }) {
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
          <span className="text-xs font-bold" style={{ color: '#FFFFFF' }}>${qr.totalUsd?.toFixed(2)}</span>
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
                <div style={{ color: h.change24h >= 0 ? '#FFFFFF' : '#FFFFFF' }}>
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
            <span className="font-bold" style={{ color: parseInt(qr.fearGreed.value) > 60 ? '#FFFFFF' : parseInt(qr.fearGreed.value) < 40 ? '#FFFFFF' : '#AAAAAA' }}>
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
              <div style={{ color: p.price_change_percentage_24h >= 0 ? '#FFFFFF' : '#FFFFFF' }}>
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
                {t.rank && <span style={{ color: '#FFFFFF' }}>#{t.rank}</span>}
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
              <div className="font-bold" style={{ color: '#FFFFFF' }}>{p.apy}% APY</div>
              <div style={{ color: p.risk === 'high' ? '#FFFFFF' : p.risk === 'medium' ? '#AAAAAA' : '#FFFFFF' }}>
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
              <a href={`https://solscan.io/tx/${tx.signature}`} target="_blank" rel="noreferrer" className="text-xs" style={{ color: '#FFFFFF' }}>View</a>
            </div>
            <div style={{ color: '#999' }}>{tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleDateString() : ''}</div>
          </div>
        ))}
      </div>
    )
  }

  // Tax report
  if (qr.type === 'tax_report') {
    return (
      <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-3 py-2 flex justify-between items-center" style={{ backgroundColor: 'var(--background)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Tax Report {qr.year}</span>
          <span className="text-xs" style={{ color: '#FFFFFF' }}>{qr.taxableEvents} taxable events</span>
        </div>
        <div className="px-3 py-2 grid grid-cols-3 gap-2 text-xs" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="text-center"><div className="font-bold" style={{ color: 'var(--foreground)' }}>{qr.totalSwaps}</div><div style={{ color: '#999' }}>Total Swaps</div></div>
          <div className="text-center"><div className="font-bold" style={{ color: '#FFFFFF' }}>{qr.taxableEvents}</div><div style={{ color: '#999' }}>Taxable</div></div>
          <div className="text-center"><div className="font-bold" style={{ color: '#FFFFFF' }}>{qr.disposals}</div><div style={{ color: '#999' }}>Disposals</div></div>
        </div>
        {qr.swaps?.slice(0, 5).map((s: any, i: number) => (
          <div key={i} className="px-3 py-2 text-xs flex justify-between" style={{ borderTop: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--foreground)' }}>{s.tokenIn} → {s.tokenOut}</div>
            <div style={{ color: '#999' }}>{s.date}</div>
          </div>
        ))}
        {qr.swaps?.length > 5 && <div className="px-3 py-2 text-xs" style={{ color: '#999', borderTop: '1px solid var(--border)' }}>+{qr.swaps.length - 5} more events</div>}
      </div>
    )
  }

  // Capital gains
  if (qr.type === 'capital_gains') {
    return (
      <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-3 py-2" style={{ backgroundColor: 'var(--background)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Capital Gains Estimate</span>
        </div>
        <div className="px-3 py-2 grid grid-cols-3 gap-3 text-xs" style={{ borderTop: '1px solid var(--border)' }}>
          <div><div className="font-bold text-sm" style={{ color: parseFloat(qr.realizedGains) >= 0 ? '#FFFFFF' : '#FFFFFF' }}>${qr.realizedGains}</div><div style={{ color: '#999' }}>Realized Gains</div></div>
          <div><div className="font-bold text-sm" style={{ color: '#AAAAAA' }}>${qr.estimatedTax}</div><div style={{ color: '#999' }}>Est. Tax (~20%)</div></div>
          <div><div className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{qr.disposals || 0}</div><div style={{ color: '#999' }}>Disposals</div></div>
        </div>
        {qr.disposalDetails?.length > 0 && qr.disposalDetails.map((d: any, i: number) => (
          <div key={i} className="px-3 py-2 text-xs flex justify-between" style={{ borderTop: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--foreground)' }}>Sold {d.amount?.toFixed ? d.amount.toFixed(4) : d.amount} {d.token} <span style={{ color: '#999' }}>on {d.date}</span></div>
            <div style={{ color: parseFloat(d.gain) >= 0 ? '#FFFFFF' : '#FFFFFF' }}>{parseFloat(d.gain) >= 0 ? '+' : ''}${d.gain}</div>
          </div>
        ))}
        {qr.realizedGains === '0.00' && qr.totalSwaps === 0 && (
          <div className="px-3 py-2 text-xs" style={{ color: '#999', borderTop: '1px solid var(--border)' }}>No swap transactions found in your history.</div>
        )}
        <div className="px-3 py-2 text-xs" style={{ color: '#999', borderTop: '1px solid var(--border)' }}>{qr.note}</div>
      </div>
    )
  }

  // CSV export
  if (qr.type === 'csv_export') {
    const blob = typeof window !== 'undefined' ? new Blob([qr.csv || ''], { type: 'text/csv' }) : null
    const url = blob ? URL.createObjectURL(blob) : '#'
    return (
      <div className="mt-3 p-3 rounded-lg flex items-center justify-between text-xs" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
        <div>
          <div className="font-semibold" style={{ color: 'var(--foreground)' }}>Trade Export Ready</div>
          <div style={{ color: '#999' }}>{qr.rowCount} transactions</div>
        </div>
        {blob && (
          <a href={url} download="defi-trades.csv" className="px-3 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: '#FFFFFF' }}>
            Download CSV
          </a>
        )}
      </div>
    )
  }

  // Tax-loss harvesting
  if (qr.type === 'tax_loss_harvesting') {
    if (!qr.opportunities?.length) return (
      <div className="mt-3 p-3 rounded-lg text-xs" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: '#999' }}>
        No tax-loss harvesting opportunities found — all positions are in profit!
      </div>
    )
    return (
      <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-3 py-2 text-xs font-semibold" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>Tax-Loss Harvesting Opportunities</div>
        {qr.opportunities.map((o: any, i: number) => (
          <div key={i} className="px-3 py-2 flex justify-between text-xs" style={{ borderTop: '1px solid var(--border)' }}>
            <div><span className="font-semibold" style={{ color: 'var(--foreground)' }}>{o.symbol}</span><span className="ml-2" style={{ color: '#999' }}>Basis: ${o.costBasis}</span></div>
            <div className="text-right"><div style={{ color: '#FFFFFF' }}>{o.unrealizedLoss} USD ({o.lossPercent}%)</div><div style={{ color: '#999' }}>Current: ${o.currentValue}</div></div>
          </div>
        ))}
      </div>
    )
  }

  // Proof of funds
  if (qr.type === 'proof_of_funds') {
    return (
      <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-3 py-2 flex justify-between items-center" style={{ backgroundColor: 'var(--background)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Proof of Funds</span>
          <span className="text-xs font-bold" style={{ color: '#FFFFFF' }}>${qr.totalUsd} USD</span>
        </div>
        <div className="px-3 py-2 text-xs" style={{ borderTop: '1px solid var(--border)', color: '#999' }}>
          <div>{qr.walletAddress?.slice(0, 16)}...{qr.walletAddress?.slice(-8)}</div>
          <div>Snapshot: {new Date(qr.timestamp).toLocaleString()}</div>
        </div>
        {qr.holdings?.map((h: any, i: number) => (
          <div key={i} className="px-3 py-2 flex justify-between text-xs" style={{ borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--foreground)' }}>{h.symbol} — {h.amount}</span>
            <span style={{ color: '#FFFFFF' }}>${h.usdValue}</span>
          </div>
        ))}
        <div className="px-3 py-2 text-xs" style={{ borderTop: '1px solid var(--border)' }}>
          <a href={qr.explorerUrl} target="_blank" rel="noreferrer" style={{ color: '#FFFFFF' }}>View on Solscan →</a>
        </div>
      </div>
    )
  }

  // ── Payment cards ────────────────────────────────────────────────────────

  // Scheduled payment
  if (qr.type === 'scheduled_payment_preview') {
    const resolvedQr = { ...qr }
    if (userAddress && intent?.recipient) {
      const resolved = resolveContact(userAddress, intent.recipient)
      resolvedQr.toAddress = resolved
      const isName = !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(intent.recipient) && !intent.recipient.endsWith('.sol')
      resolvedQr.toDisplay = isName ? `${intent.recipient} (${resolved.slice(0, 8)}...)` : resolved
    }
    return <ScheduledPaymentCard qr={resolvedQr} userAddress={userAddress} />
  }

  // Direct payment preview — confirm + sign
  if (qr.type === 'payment_preview') {
    // Patch toAddress from resolved intent.recipient (contact name resolution happens client-side)
    const resolvedQr = { ...qr }
    if (userAddress && intent?.recipient) {
      const resolved = resolveContact(userAddress, intent.recipient)
      resolvedQr.toAddress = resolved
      // toDisplay: if original was a name (not an address), show "hassan (3Y4R...)"
      const isName = !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(intent.recipient) && !intent.recipient.endsWith('.sol')
      resolvedQr.toDisplay = isName ? `${intent.recipient} (${resolved.slice(0, 8)}...)` : resolved
    }
    return <PaymentConfirmCard qr={resolvedQr} fromWallet={userAddress || intent?.fromWallet} />
  }

  // Batch / split payment
  if (qr.type === 'batch_payment_preview') {
    return (
      <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-3 py-2 flex justify-between items-center" style={{ backgroundColor: 'var(--background)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Batch Payment — {qr.token}</span>
          <span className="text-xs font-bold" style={{ color: '#FFFFFF' }}>Total: {qr.total} {qr.token}</span>
        </div>
        {qr.recipients?.map((r: any, i: number) => (
          <div key={i} className="px-3 py-2 flex justify-between text-xs" style={{ borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--foreground)' }}>{r.displayName || r.address?.slice(0,16)}...</span>
            <span style={{ color: '#FFFFFF' }}>{r.amount} {qr.token}</span>
          </div>
        ))}
        <div className="px-3 py-2 text-xs" style={{ color: '#999', borderTop: '1px solid var(--border)' }}>
          Connect wallet and approve each transaction in Phantom to send.
        </div>
      </div>
    )
  }

  // Payment request link
  if (qr.type === 'payment_link') {
    return (
      <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-3 py-2" style={{ backgroundColor: 'var(--background)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Payment Request — {qr.amount} {qr.token}</span>
        </div>
        <div className="px-3 py-2 space-y-2">
          <div className="text-xs break-all p-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#FFFFFF', fontFamily: 'monospace' }}>
            {qr.webUrl}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(qr.webUrl)}
              className="flex-1 py-1.5 rounded text-xs font-medium"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: '#FFFFFF' }}
            >
              Copy Link
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(qr.solanaPayUrl)}
              className="flex-1 py-1.5 rounded text-xs font-medium"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: '#FFFFFF' }}
            >
              Copy Solana Pay URL
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Spending summary
  if (qr.type === 'spending_summary') {
    return (
      <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-3 py-2 flex justify-between items-center" style={{ backgroundColor: 'var(--background)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Payments — {qr.month}</span>
          <span className="text-xs font-bold" style={{ color: '#FFFFFF' }}>${qr.totalUsd} sent</span>
        </div>
        <div className="px-3 py-2 grid grid-cols-3 gap-2 text-xs" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="text-center"><div className="font-bold" style={{ color: 'var(--foreground)' }}>{qr.transferCount}</div><div style={{ color: '#999' }}>Transfers</div></div>
          <div className="text-center"><div className="font-bold" style={{ color: '#FFFFFF' }}>{qr.totalSolOut} SOL</div><div style={{ color: '#999' }}>SOL Sent</div></div>
          <div className="text-center"><div className="font-bold" style={{ color: '#FFFFFF' }}>${qr.totalUsdcOut}</div><div style={{ color: '#999' }}>USDC Sent</div></div>
        </div>
        {qr.transfers?.map((t: any, i: number) => (
          <div key={i} className="px-3 py-2 flex justify-between text-xs" style={{ borderTop: '1px solid var(--border)' }}>
            <div><span style={{ color: 'var(--foreground)' }}>To {t.to}</span><span className="ml-2" style={{ color: '#999' }}>{t.date}</span></div>
            <span style={{ color: '#AAAAAA' }}>{t.amount?.toFixed ? t.amount.toFixed(4) : t.amount} {t.token}</span>
          </div>
        ))}
        {(!qr.transfers?.length) && <div className="px-3 py-2 text-xs" style={{ color: '#999', borderTop: '1px solid var(--border)' }}>No outbound payments this month.</div>}
      </div>
    )
  }

  // Generic payment info
  if (qr.type === 'payment_info') {
    return (
      <div className="mt-3 p-3 rounded-lg text-xs" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: '#999' }}>
        {qr.message}
      </div>
    )
  }

  // ── Privacy cards ────────────────────────────────────────────────────────
  if (qr.type === 'privacy_routes') {
    return <PrivacyRouteCard qr={qr} intent={intent} userAddress={userAddress} />
  }

  if (qr.type === 'privacy_send_ready') {
    return <PrivacySendReadyCard qr={qr} userAddress={userAddress} />
  }

  if (qr.type === 'stealth_address') {
    return (
      <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <span className="text-xs font-semibold" style={{ color: '#FFFFFF' }}>🔮 Stealth Address — Umbra Protocol</span>
        </div>
        <div className="px-3 py-2 space-y-1.5 text-xs" style={{ borderTop: '1px solid var(--border)' }}>
          {qr.instructions?.map((step: string, i: number) => (
            <div key={i} className="flex gap-2"><span style={{ color: '#FFFFFF' }}>{i + 1}.</span><span style={{ color: 'var(--foreground)' }}>{step}</span></div>
          ))}
        </div>
        <div className="px-3 py-2 text-xs" style={{ color: '#999', borderTop: '1px solid var(--border)' }}>{qr.note}</div>
        <div className="px-3 py-2" style={{ borderTop: '1px solid var(--border)' }}>
          <a href={qr.umbraUrl} target="_blank" rel="noreferrer"
            className="block w-full py-2 rounded-lg text-xs font-semibold text-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: '#FFFFFF' }}>
            Open Umbra Protocol →
          </a>
        </div>
      </div>
    )
  }

  if (qr.type === 'wallet_screen') {
    return (
      <div className="mt-3 p-3 rounded-lg text-xs" style={{ backgroundColor: 'var(--background)', border: `1px solid ${qr.isClean ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.12)'}` }}>
        <div className="flex justify-between mb-2">
          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Wallet Screen — {qr.source}</span>
          <span className="font-bold" style={{ color: qr.isClean ? '#FFFFFF' : '#FFFFFF' }}>{qr.isClean ? '✓ Clean' : `⚠ ${qr.riskLevel?.toUpperCase()} RISK`}</span>
        </div>
        <div className="font-mono mb-2" style={{ color: '#FFFFFF' }}>{qr.address?.slice(0, 20)}...</div>
        {qr.flags?.length > 0 && <div className="space-y-1">{qr.flags.map((f: string, i: number) => <div key={i} style={{ color: '#FFFFFF' }}>⚠ {f.replace(/_/g, ' ')}</div>)}</div>}
        {qr.flags?.length === 0 && <div style={{ color: '#999' }}>No risk flags found.</div>}
      </div>
    )
  }

  // ── Contact cards ────────────────────────────────────────────────────────
  if (qr.type === 'contact_action') {
    return <ContactActionCard qr={qr} userAddress={userAddress} />
  }

  // OFAC check
  if (qr.type === 'ofac_check') {
    return (
      <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--background)', border: `1px solid ${qr.isClean ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.12)'}` }}>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Compliance Check</span>
          <span className="font-bold" style={{ color: qr.isClean ? '#FFFFFF' : '#FFFFFF' }}>
            {qr.isClean ? '✓ Clean' : '⚠ Risk Detected'} — {qr.riskLevel?.toUpperCase()} risk
          </span>
        </div>
        {qr.flags?.length > 0 && (
          <div className="mt-2 space-y-1">{qr.flags.map((f: string, i: number) => <div key={i} className="text-xs" style={{ color: '#FFFFFF' }}>• {f}</div>)}</div>
        )}
        {qr.note && <div className="mt-1 text-xs" style={{ color: '#999' }}>{qr.note}</div>}
        <div className="mt-1 text-xs" style={{ color: '#999' }}>Checked: {new Date(qr.checkedAt).toLocaleString()}</div>
      </div>
    )
  }

  return null
}

const PRIVACY_LEVEL_COLOR: Record<string, string> = { Maximum: '#FFFFFF', High: '#CCCCCC', Medium: '#888888' }

function PrivacySendReadyCard({ qr, userAddress }: { qr: any; userAddress?: string }) {
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(qr.depositAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSend = async () => {
    if (!userAddress || !qr.depositAddress) return
    setSending(true)
    try {
      const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = await import('@solana/web3.js')
      const phantom = (window as any).phantom?.solana
      if (!phantom?.isConnected) await phantom.connect()
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com')
      const from = new PublicKey(userAddress)
      const to = new PublicKey(qr.depositAddress)
      const { blockhash } = await connection.getLatestBlockhash()
      const tx = new Transaction({ recentBlockhash: blockhash, feePayer: from })
      tx.add(SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports: Math.round(qr.amountIn * LAMPORTS_PER_SOL) }))
      const signed = await phantom.signTransaction(tx)
      const sig = await connection.sendRawTransaction(signed.serialize())
      setDone(sig)
    } catch (e: any) {
      alert(`Send failed: ${e.message}`)
    } finally {
      setSending(false)
    }
  }

  if (done) return (
    <div className="mt-3 p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}>
      <div className="font-semibold mb-1" style={{ color: '#FFFFFF' }}>✓ Sent to {qr.provider}!</div>
      <div style={{ color: '#999' }} className="mb-1">Private routing in progress — ETA: {qr.eta}</div>
      <a href={`https://solscan.io/tx/${done}`} target="_blank" rel="noreferrer" style={{ color: '#FFFFFF' }}>View deposit on Solscan →</a>
    </div>
  )

  return (
    <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
      <div className="px-3 py-2 flex justify-between items-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <span className="text-xs font-semibold" style={{ color: '#FFFFFF' }}>🔒 {qr.provider} — Private Send Ready</span>
        <span className="text-xs" style={{ color: '#FFFFFF' }}>ETA: {qr.eta}</span>
      </div>
      <div className="px-3 py-2 text-xs space-y-1.5" style={{ borderTop: '1px solid var(--border)' }}>
        <div style={{ color: '#999' }}>{qr.instruction}</div>
        <div className="flex justify-between pt-1"><span style={{ color: '#999' }}>You send</span><span style={{ color: '#AAAAAA' }}>{qr.amountIn} {qr.tokenIn}</span></div>
        <div className="flex justify-between"><span style={{ color: '#999' }}>Recipient gets</span><span style={{ color: '#FFFFFF' }}>{qr.amountOut} {qr.tokenOut}</span></div>
        <div className="flex justify-between"><span style={{ color: '#999' }}>Expires</span><span style={{ color: 'var(--foreground)' }}>{qr.expires ? new Date(qr.expires).toLocaleTimeString() : 'N/A'}</span></div>
      </div>
      {/* Deposit address */}
      <div className="px-3 py-2 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="text-xs" style={{ color: '#999' }}>Deposit address (send your funds here):</div>
        <div className="flex items-center gap-2">
          <div className="font-mono text-[10px] flex-1 p-1.5 rounded truncate" style={{ backgroundColor: 'var(--hover)', color: '#FFFFFF' }}>
            {qr.depositAddress}
          </div>
          <button onClick={handleCopy} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: '#FFFFFF' }}>
            {copied ? '✓' : 'Copy'}
          </button>
        </div>
      </div>
      {/* Send button */}
      <div className="px-3 py-2" style={{ borderTop: '1px solid var(--border)' }}>
        <button onClick={handleSend} disabled={sending}
          className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
          style={{ backgroundColor: sending ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.10)', color: '#FFFFFF' }}>
          {sending ? <><Loader2 className="w-3 h-3 animate-spin" />Sending via Phantom...</> : `Send ${qr.amountIn} ${qr.tokenIn} via Phantom →`}
        </button>
      </div>
    </div>
  )
}

function PrivacyRouteCard({ qr, intent, userAddress }: { qr: any; intent: any; userAddress?: string }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [initiating, setInitiating] = useState<string | null>(null)
  const [directResult, setDirectResult] = useState<any>(null)
  const recipient = intent?.recipient ? resolveContact(userAddress || '', intent.recipient) : qr.recipient

  const handleUse = async (provider: any) => {
    setSelected(provider.provider)

    // GhostPay and Houdini — call backend to initiate directly
    if (provider.apiDirect && recipient && qr.amount) {
      const pName = provider.provider.toLowerCase()
      const providerKey = pName.includes('ghost') ? 'GhostPay' : pName.includes('houdini') ? 'Houdini Swap' : null
      if (providerKey) {
        setInitiating(provider.provider)
        try {
          const res = await fetch('/api/copilot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `send ${qr.amount} ${qr.tokenIn} to ${recipient} privately via ${providerKey}`,
              walletAddress: userAddress,
              chain: 'solana',
            }),
          })
          const data = await res.json()
          if (data.intent?.queryResult?.type === 'privacy_send_ready') {
            setDirectResult(data.intent.queryResult)
          } else {
            window.open(provider.url, '_blank')
          }
        } catch {
          window.open(provider.url, '_blank')
        } finally {
          setInitiating(null)
        }
        return
      }
    }
    window.open(provider.url, '_blank')
  }

  if (directResult) return <PrivacySendReadyCard qr={directResult} userAddress={userAddress} />

  return (
    <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="px-3 py-2 flex justify-between items-center" style={{ backgroundColor: 'var(--background)' }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
          🔒 Privacy Routes — {qr.amount} {qr.tokenIn}
          {recipient && ` → ${intent?.recipient || recipient.slice(0, 8)}...`}
        </span>
        <span className="text-xs" style={{ color: '#999' }}>
          {qr.autoSelect === 'lowest_fee' ? '⚡ Lowest fee selected' : qr.autoSelect === 'highest_privacy' ? '🛡 Max privacy selected' : '⏱ Fastest selected'}
        </span>
      </div>

      {/* Column headers */}
      <div className="px-3 py-1.5 grid grid-cols-5 text-xs font-medium" style={{ borderTop: '1px solid var(--border)', color: '#999' }}>
        <span className="col-span-2">Provider</span>
        <span className="text-center">Fee</span>
        <span className="text-center">Privacy</span>
        <span className="text-center">ETA</span>
      </div>

      {/* Provider rows */}
      {qr.providers?.map((p: any) => (
        <div
          key={p.provider}
          onClick={() => handleUse(p)}
          className="px-3 py-2.5 grid grid-cols-5 items-center text-xs cursor-pointer transition-colors"
          style={{
            borderTop: '1px solid var(--border)',
            backgroundColor: p.recommended ? 'rgba(255,255,255,0.03)' : selected === p.provider ? 'rgba(255,255,255,0.03)' : 'transparent',
          }}
        >
          {/* Provider name + badge */}
          <div className="col-span-2 flex items-center gap-1.5">
            <span className="text-base leading-none">{p.icon}</span>
            <div>
              <div className="font-semibold flex items-center gap-1" style={{ color: 'var(--foreground)' }}>
                {p.provider}
                {p.recommended && (
                  <span className="px-1 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: '#FFFFFF' }}>
                    ✓ Best
                  </span>
                )}
              </div>
              <div style={{ color: '#999' }} className="text-[10px] truncate max-w-[110px]">{p.method}</div>
            </div>
          </div>

          {/* Fee */}
          <div className="text-center">
            <div className="font-semibold" style={{ color: '#AAAAAA' }}>
              {p.feePct === 0 ? 'Free' : `${p.feePct}%`}
            </div>
            <div style={{ color: '#999' }} className="text-[10px]">${p.feeUsd}</div>
          </div>

          {/* Privacy level */}
          <div className="text-center">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
              style={{ backgroundColor: `${PRIVACY_LEVEL_COLOR[p.privacyLevel]}20`, color: PRIVACY_LEVEL_COLOR[p.privacyLevel] }}>
              {p.privacyLevel}
            </span>
          </div>

          {/* ETA + button */}
          <div className="text-center">
            <div style={{ color: 'var(--foreground)' }}>{p.estimatedTime}</div>
            {initiating === p.provider
              ? <Loader2 className="w-3 h-3 animate-spin mx-auto mt-0.5" style={{ color: '#FFFFFF' }} />
              : <div style={{ color: p.apiDirect ? '#FFFFFF' : '#FFFFFF' }} className="text-[10px]">{p.apiDirect ? 'Direct ✓' : 'Open →'}</div>
            }
          </div>
        </div>
      ))}

      {/* Recommended summary */}
      {qr.recommended && (
        <div className="px-3 py-2 text-xs flex items-center gap-1" style={{ borderTop: '1px solid var(--border)', color: '#999' }}>
          <span>System selected <strong style={{ color: '#FFFFFF' }}>{qr.recommended}</strong> as best. <strong style={{ color: '#FFFFFF' }}>GhostPay</strong> and <strong style={{ color: '#FFFFFF' }}>Houdini</strong> execute directly — no redirect. Railgun and Umbra open their apps.</span>
        </div>
      )}
    </div>
  )
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return 'Now'
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  const mins = Math.floor((ms % 3600000) / 60000)
  return days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

function ScheduledPaymentCard({ qr, userAddress }: { qr: any; userAddress?: string }) {
  const [entry, setEntry] = useState<ScheduledPayment | null>(null)
  const [timeLeft, setTimeLeft] = useState('')
  const [fired, setFired] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [sessionKey, setSessionKey] = useState<SessionKey | null>(null)
  const [sessionBalance, setSessionBalance] = useState<number>(0)
  const [setupStep, setSetupStep] = useState<'idle' | 'creating' | 'funding' | 'ready'>('idle')
  const [setupError, setSetupError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  // Save payment + check session key on mount
  useEffect(() => {
    if (!userAddress || !qr.toAddress || !qr.amount) return
    const parsed = parseScheduleDate(qr.scheduleDate || '')
    if (!parsed) return
    const saved = saveScheduledPayment(userAddress, {
      fromWallet: userAddress,
      toAddress: qr.toAddress,
      toDisplay: qr.toDisplay || qr.toAddress,
      token: qr.token,
      amount: qr.amount,
      mint: qr.mint,
      decimals: qr.decimals,
      scheduledAt: parsed.ts,
      label: parsed.label,
      status: 'pending',
    })
    setEntry(saved)
    const sk = getSessionKey(userAddress)
    setSessionKey(sk)
    if (sk) {
      getSessionBalance(userAddress).then(b => {
        setSessionBalance(b)
        setSetupStep(b >= qr.amount + 0.001 ? 'ready' : 'funding')
      })
    }
  }, [])

  // Countdown + auto-fire using session key
  useEffect(() => {
    if (!entry || cancelled || entry.status === 'sent') return
    const tick = () => setTimeLeft(formatTimeLeft(entry.scheduledAt - Date.now()))
    tick()
    const interval = setInterval(async () => {
      const diff = entry.scheduledAt - Date.now()
      setTimeLeft(formatTimeLeft(diff))
      if (diff > 0 || fired) return
      setFired(true)
      clearInterval(interval)

      const sk = getSessionKey(userAddress!)
      if (sk) {
        // ── True auto-send via session key ──────────────────────────────
        setStatusMsg('Auto-sending via session key...')
        try {
          const sig = await sessionKeySend(userAddress!, entry.toAddress, entry.amount)
          updateScheduledPayment(userAddress!, entry.id, { status: 'sent', txSignature: sig })
          setEntry(prev => prev ? { ...prev, status: 'sent', txSignature: sig } : prev)
        } catch (e: any) {
          setStatusMsg(`Auto-send failed: ${e.message}. Falling back to Phantom...`)
          phantomFallback()
        }
      } else {
        // ── Fallback: Phantom popup ─────────────────────────────────────
        phantomFallback()
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [entry, cancelled, fired])

  const phantomFallback = async () => {
    try {
      const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = await import('@solana/web3.js')
      const phantom = (window as any).phantom?.solana
      if (!phantom?.isConnected) await phantom?.connect()
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com')
      const from = new PublicKey(userAddress!)
      const to = new PublicKey(entry!.toAddress)
      const { blockhash } = await connection.getLatestBlockhash()
      const tx = new Transaction({ recentBlockhash: blockhash, feePayer: from })
      tx.add(SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports: Math.round(entry!.amount * LAMPORTS_PER_SOL) }))
      const signed = await phantom.signTransaction(tx)
      const sig = await connection.sendRawTransaction(signed.serialize())
      updateScheduledPayment(userAddress!, entry!.id, { status: 'sent', txSignature: sig })
      setEntry(prev => prev ? { ...prev, status: 'sent', txSignature: sig } : prev)
    } catch (e: any) {
      updateScheduledPayment(userAddress!, entry!.id, { status: 'failed' })
      setEntry(prev => prev ? { ...prev, status: 'failed' } : prev)
    }
  }

  const handleCreateSessionKey = async () => {
    setSetupStep('creating')
    setSetupError('')
    try {
      const result = await createSessionKey(userAddress!, Math.max(qr.amount * 2, 1), 30)
      setSessionKey(result.sessionKey)
      setSetupStep('funding')
    } catch (e: any) {
      setSetupError(e.message)
      setSetupStep('idle')
    }
  }

  const handleFundSessionKey = async () => {
    setSetupError('')
    try {
      const needed = qr.amount + 0.005  // amount + fees
      await fundSessionKey(userAddress!, needed)
      const bal = await getSessionBalance(userAddress!)
      setSessionBalance(bal)
      setSetupStep('ready')
    } catch (e: any) {
      setSetupError(e.message)
    }
  }

  if (!entry) {
    if (!parseScheduleDate(qr.scheduleDate || '')) return (
      <div className="mt-3 p-3 rounded-lg text-xs" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: '#FFFFFF' }}>
        Could not parse &quot;{qr.scheduleDate}&quot;. Try &quot;april 15&quot;, &quot;tomorrow&quot;, or &quot;in 3 days&quot;.
      </div>
    )
    return null
  }

  if (entry.status === 'sent') return (
    <div className="mt-3 p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}>
      <div className="font-semibold mb-1" style={{ color: '#FFFFFF' }}>✓ Payment sent automatically!</div>
      {entry.txSignature && <a href={`https://solscan.io/tx/${entry.txSignature}`} target="_blank" rel="noreferrer" style={{ color: '#FFFFFF' }}>View on Solscan →</a>}
    </div>
  )
  if (cancelled || entry.status === 'cancelled') return (
    <div className="mt-3 p-3 rounded-lg text-xs" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: '#999' }}>Scheduled payment cancelled.</div>
  )

  const hasSessionKey = !!sessionKey && setupStep === 'ready'

  return (
    <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
      {/* Header */}
      <div className="px-3 py-2 flex justify-between items-center" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
        <span className="text-xs font-semibold" style={{ color: '#FFFFFF' }}>⏰ Scheduled Payment</span>
        <span className="text-xs font-bold" style={{ color: '#FFFFFF' }}>{timeLeft ? `in ${timeLeft}` : entry.label}</span>
      </div>

      {/* Payment details */}
      <div className="px-3 py-2 text-xs space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex justify-between"><span style={{ color: '#999' }}>To</span><span style={{ color: 'var(--foreground)' }}>{entry.toDisplay}</span></div>
        <div className="flex justify-between"><span style={{ color: '#999' }}>Amount</span><span style={{ color: 'var(--foreground)' }}>{entry.amount} {entry.token}</span></div>
        <div className="flex justify-between"><span style={{ color: '#999' }}>Send date</span><span style={{ color: '#FFFFFF' }}>{entry.label}</span></div>
        <div className="flex justify-between">
          <span style={{ color: '#999' }}>Mode</span>
          <span style={{ color: hasSessionKey ? '#FFFFFF' : '#AAAAAA' }}>
            {hasSessionKey ? '🔑 Session key — fully automatic' : '⚠ Phantom required on send date'}
          </span>
        </div>
        {statusMsg && <div style={{ color: '#AAAAAA' }}>{statusMsg}</div>}
      </div>

      {/* Session key setup */}
      {!hasSessionKey && (
        <div className="px-3 py-2 space-y-2 text-xs" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div className="font-semibold" style={{ color: '#FFFFFF' }}>🔑 Enable auto-send with Session Key</div>
          <div style={{ color: '#999' }}>
            A session key lets this payment fire automatically without Phantom approval.
            You sign once now, then it sends itself on {entry.label}.
          </div>
          {setupStep === 'idle' && (
            <button onClick={handleCreateSessionKey}
              className="w-full py-1.5 rounded font-medium"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: '#FFFFFF' }}>
              Set Up Session Key (sign message — no gas)
            </button>
          )}
          {setupStep === 'creating' && (
            <div className="flex items-center gap-2" style={{ color: '#999' }}><Loader2 className="w-3 h-3 animate-spin" />Waiting for Phantom signature...</div>
          )}
          {setupStep === 'funding' && sessionKey && (
            <div className="space-y-2">
              <div style={{ color: '#999' }}>
                Fund the session wallet with <strong style={{ color: '#AAAAAA' }}>{(qr.amount + 0.005).toFixed(4)} SOL</strong> (payment amount + fees).
                This is the only Phantom approval needed.
              </div>
              <div className="font-mono text-[10px] p-1.5 rounded break-all" style={{ backgroundColor: 'var(--hover)', color: '#FFFFFF' }}>
                {sessionKey.publicKey}
              </div>
              <button onClick={handleFundSessionKey}
                className="w-full py-1.5 rounded font-medium"
                style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: '#FFFFFF' }}>
                Fund Session Wallet via Phantom (one-time)
              </button>
            </div>
          )}
          {setupError && <div style={{ color: '#FFFFFF' }}>{setupError}</div>}
        </div>
      )}

      {hasSessionKey && (
        <div className="px-3 py-2 text-xs" style={{ borderTop: '1px solid var(--border)', color: '#999' }}>
          Session wallet balance: <strong style={{ color: '#FFFFFF' }}>{sessionBalance.toFixed(4)} SOL</strong> · Expires {new Date(sessionKey!.expiresAt).toLocaleDateString()}
        </div>
      )}

      <div className="px-3 py-2" style={{ borderTop: '1px solid var(--border)' }}>
        <button onClick={() => { cancelScheduledPayment(userAddress!, entry.id); setCancelled(true) }}
          className="w-full py-1.5 rounded text-xs font-medium"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#FFFFFF' }}>
          Cancel Scheduled Payment
        </button>
      </div>
    </div>
  )
}

function ContactActionCard({ qr, userAddress }: { qr: any; userAddress?: string }) {
  const [contacts, setContacts] = useState<Contact[]>(() => userAddress ? getContacts(userAddress) : [])
  const [editName, setEditName] = useState('')
  const [editAddr, setEditAddr] = useState('')
  const [saved, setSaved] = useState(false)
  const [deleted, setDeleted] = useState(false)

  // Execute save/edit/delete immediately on mount
  useEffect(() => {
    if (!userAddress) return
    if ((qr.queryType === 'save' || qr.queryType === 'edit') && qr.contactName && qr.contactAddress) {
      const updated = saveContact(userAddress, qr.contactName, qr.contactAddress)
      setContacts(updated)
      setSaved(true)
    } else if (qr.queryType === 'delete' && qr.contactName) {
      const updated = deleteContact(userAddress, qr.contactName)
      setContacts(updated)
      setDeleted(true)
    } else {
      setContacts(getContacts(userAddress))
    }
  }, [])

  // Save / edit form
  if (qr.queryType === 'save' || qr.queryType === 'edit') {
    if (!qr.contactName || !qr.contactAddress) {
      // Missing info — show inline form
      return (
        <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="px-3 py-2" style={{ backgroundColor: 'var(--background)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Save Contact</span>
          </div>
          <div className="px-3 py-2 space-y-2">
            <input
              className="w-full rounded px-2 py-1.5 text-xs focus:outline-none"
              style={{ backgroundColor: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              placeholder="Name (e.g. hassan)"
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />
            <input
              className="w-full rounded px-2 py-1.5 text-xs focus:outline-none font-mono"
              style={{ backgroundColor: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              placeholder="Wallet address"
              value={editAddr}
              onChange={e => setEditAddr(e.target.value)}
            />
            <button
              onClick={() => {
                if (!userAddress || !editName || !editAddr) return
                const updated = saveContact(userAddress, editName, editAddr)
                setContacts(updated)
                setSaved(true)
              }}
              className="w-full py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: '#FFFFFF' }}
            >
              <UserPlus className="w-3 h-3" /> Save Contact
            </button>
          </div>
        </div>
      )
    }
    return (
      <div className="mt-3 p-3 rounded-lg flex items-center gap-2 text-xs"
        style={{ backgroundColor: saved ? 'rgba(255,255,255,0.04)' : 'var(--background)', border: `1px solid ${saved ? 'rgba(255,255,255,0.12)' : 'var(--border)'}` }}>
        {saved
          ? <><Check className="w-3 h-3" style={{ color: '#FFFFFF' }} /><span style={{ color: '#FFFFFF' }}>Saved <strong>{qr.contactName}</strong> → {qr.contactAddress?.slice(0, 12)}...</span></>
          : <><Loader2 className="w-3 h-3 animate-spin" /><span style={{ color: '#999' }}>Saving...</span></>
        }
      </div>
    )
  }

  // Delete
  if (qr.queryType === 'delete') {
    return (
      <div className="mt-3 p-3 rounded-lg flex items-center gap-2 text-xs"
        style={{ backgroundColor: 'var(--background)', border: `1px solid ${deleted ? 'rgba(255,255,255,0.12)' : 'var(--border)'}` }}>
        {deleted
          ? <><Trash2 className="w-3 h-3" style={{ color: '#FFFFFF' }} /><span style={{ color: '#FFFFFF' }}><strong>{qr.contactName}</strong> removed from contacts.</span></>
          : <><Loader2 className="w-3 h-3 animate-spin" /><span style={{ color: '#999' }}>Removing...</span></>
        }
      </div>
    )
  }

  // Lookup
  if (qr.queryType === 'lookup') {
    const found = contacts.find(c => c.name === qr.contactName?.toLowerCase())
    return (
      <div className="mt-3 p-3 rounded-lg text-xs" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
        {found
          ? <div><div className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>{found.displayName}</div><div className="font-mono" style={{ color: '#FFFFFF' }}>{found.address}</div></div>
          : <span style={{ color: '#999' }}>No contact found for &quot;{qr.contactName}&quot;.</span>
        }
      </div>
    )
  }

  // List contacts
  return (
    <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="px-3 py-2 flex justify-between items-center" style={{ backgroundColor: 'var(--background)' }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>My Contacts</span>
        <span className="text-xs" style={{ color: '#999' }}>{contacts.length} saved</span>
      </div>
      {contacts.length === 0 && (
        <div className="px-3 py-3 text-xs" style={{ color: '#999' }}>No contacts saved yet. Try &quot;save this address as hassan: &lt;address&gt;&quot;</div>
      )}
      {contacts.map((c, i) => (
        <div key={i} className="px-3 py-2 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border)' }}>
          <div>
            <div className="font-semibold" style={{ color: 'var(--foreground)' }}>{c.displayName}</div>
            <div className="font-mono text-xs truncate max-w-[180px]" style={{ color: '#FFFFFF' }}>{c.address}</div>
          </div>
          <button
            onClick={() => { if (userAddress) { deleteContact(userAddress, c.displayName); setContacts(getContacts(userAddress)) } }}
            className="p-1 rounded opacity-50 hover:opacity-100"
            title="Remove"
          >
            <Trash2 className="w-3 h-3" style={{ color: '#FFFFFF' }} />
          </button>
        </div>
      ))}
    </div>
  )
}

function PaymentConfirmCard({ qr, fromWallet }: { qr: any; fromWallet?: string }) {
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  const handleSend = async () => {
    const wallet = fromWallet || qr.fromWallet
    if (!wallet) return alert('Wallet not connected')
    setSending(true)
    try {
      const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = await import('@solana/web3.js')
      const phantom = (window as any).phantom?.solana
      if (!phantom) throw new Error('Phantom wallet not found')
      if (!phantom.isConnected) await phantom.connect()

      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com')
      const from = new PublicKey(wallet)
      const to = new PublicKey(qr.toAddress)
      const { blockhash } = await connection.getLatestBlockhash()
      const tx = new Transaction({ recentBlockhash: blockhash, feePayer: from })

      if (qr.token === 'SOL') {
        tx.add(SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports: Math.round(qr.amount * LAMPORTS_PER_SOL) }))
      } else if (qr.mint) {
        // SPL token transfer — use Token class from @solana/spl-token v1
        const splToken = await import('@solana/spl-token')
        const TOKEN_PROGRAM_ID = splToken.TOKEN_PROGRAM_ID
        const mintPk = new PublicKey(qr.mint)
        const fromATA = await (splToken as any).Token.getAssociatedTokenAddress
          ? (splToken as any).Token.getAssociatedTokenAddress(splToken.ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mintPk, from)
          : (splToken as any).getAssociatedTokenAddress(mintPk, from)
        const toATA = await ((splToken as any).Token?.getAssociatedTokenAddress
          ? (splToken as any).Token.getAssociatedTokenAddress(splToken.ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mintPk, to)
          : (splToken as any).getAssociatedTokenAddress(mintPk, to))
        const rawAmount = Math.round(qr.amount * Math.pow(10, qr.decimals || 6))
        const transferIx = (splToken as any).Token?.createTransferInstruction
          ? (splToken as any).Token.createTransferInstruction(TOKEN_PROGRAM_ID, fromATA, toATA, from, [], rawAmount)
          : (splToken as any).createTransferInstruction(fromATA, toATA, from, rawAmount)
        tx.add(transferIx)
      }

      const signed = await phantom.signTransaction(tx)
      const sig = await connection.sendRawTransaction(signed.serialize())
      setDone(sig)
    } catch (e: any) {
      alert(`Send failed: ${e.message}`)
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className="mt-3 p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="font-semibold mb-1" style={{ color: '#FFFFFF' }}>✓ Payment sent!</div>
        <a href={`https://solscan.io/tx/${done}`} target="_blank" rel="noreferrer" style={{ color: '#FFFFFF' }}>View on Solscan →</a>
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="px-3 py-2 flex justify-between items-center" style={{ backgroundColor: 'var(--background)' }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Send {qr.token}</span>
        <span className="text-xs font-bold" style={{ color: '#FFFFFF' }}>~${Math.abs(parseFloat(qr.usdValue || '0')).toFixed(2)}</span>
      </div>
      <div className="px-3 py-2 text-xs space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex justify-between"><span style={{ color: '#999' }}>To</span><span style={{ color: 'var(--foreground)' }}>{qr.toDisplay}</span></div>
        <div className="flex justify-between"><span style={{ color: '#999' }}>Amount</span><span style={{ color: 'var(--foreground)' }}>{qr.amount} {qr.token}</span></div>
        {qr.memo && <div className="flex justify-between"><span style={{ color: '#999' }}>Memo</span><span style={{ color: 'var(--foreground)' }}>{qr.memo}</span></div>}
        <div className="flex justify-between"><span style={{ color: '#999' }}>Network</span><span style={{ color: 'var(--foreground)' }}>Solana</span></div>
      </div>
      <div className="px-3 py-2" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: '#FFFFFF' }}
        >
          {sending ? <><Loader2 className="w-3 h-3 animate-spin" />Sending...</> : `Send ${qr.amount} ${qr.token}`}
        </button>
      </div>
    </div>
  )
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
        {order.triggerPrice && <div style={{ color: '#FFFFFF' }}>Trigger: ${order.triggerPrice}</div>}
      </div>
      <button
        onClick={handleCancel}
        disabled={cancelling}
        className="ml-3 px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-40"
        style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#FFFFFF' }}
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

      // ── Resolve contact names in payment intents ───────────────────────
      if (data.intent?.action === 'payment' && address) {
        const intent = data.intent
        if (intent.recipient) {
          intent.recipient = resolveContact(address, intent.recipient)
        }
        if (intent.recipients?.length) {
          const resolved = resolveContacts(address, intent.recipients)
          intent.recipients = resolved.map(r => r.address)
          // Rebuild queryResult with resolved addresses if it exists
          if (intent.queryResult?.recipients) {
            intent.queryResult.recipients = intent.queryResult.recipients.map((r: any, i: number) => ({
              ...r,
              address: resolved[i]?.address || r.address,
              displayName: resolved[i]?.displayName || resolved[i]?.input || r.address,
            }))
          }
        }
        data.intent = intent
      }

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
                  <QueryResultCard intent={message.intent} userAddress={address} />
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
