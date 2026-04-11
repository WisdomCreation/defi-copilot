'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, Trash2, TrendingUp, TrendingDown, Repeat } from 'lucide-react'

interface Order {
  id: string
  type: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  triggerPrice?: string
  triggerCondition?: string
  status: string
  createdAt: string
  filledAt?: string
  txHash?: string
  dcaExecutions?: number
  dcaMaxExecutions?: number
}

interface OrderDashboardProps {
  userWallet?: string
  onClose: () => void
  embedded?: boolean
}

export function OrderDashboard({ userWallet, onClose, embedded = false }: OrderDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({ total: 0, watching: 0, filled: 0, cancelled: 0, failed: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (userWallet) {
      fetchOrders()
      fetchStats()
      // Refresh every 10 seconds
      const interval = setInterval(() => {
        fetchOrders()
        fetchStats()
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [userWallet, filter])

  const fetchOrders = async () => {
    if (!userWallet) return
    
    try {
      const params = new URLSearchParams({ userWallet })
      if (filter !== 'all') params.append('status', filter)
      
      const response = await fetch(`/api/orders?${params}`)
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!userWallet) return
    
    try {
      const response = await fetch(`/api/orders/stats?userWallet=${userWallet}`)
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Cancel this order?')) return
    
    try {
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, userWallet }),
      })
      
      if (response.ok) {
        fetchOrders()
        fetchStats()
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
    }
  }

  const getOrderIcon = (type: string) => {
    switch (type) {
      case 'limit':
        return <TrendingUp className="w-4 h-4" />
      case 'stop_loss':
        return <TrendingDown className="w-4 h-4" />
      case 'take_profit':
        return <TrendingUp className="w-4 h-4" />
      case 'dca':
        return <Repeat className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; icon: any }> = {
      watching: { bg: 'rgba(255,179,71,0.15)', color: '#FFB347', icon: Clock },
      triggered: { bg: 'rgba(123,112,255,0.15)', color: '#7B70FF', icon: TrendingUp },
      filled: { bg: 'rgba(0,201,167,0.15)', color: '#00C9A7', icon: CheckCircle },
      cancelled: { bg: 'rgba(139,143,173,0.15)', color: '#8B8FAD', icon: XCircle },
      failed: { bg: 'rgba(255,107,107,0.15)', color: '#FF6B6B', icon: XCircle },
    }
    
    const style = styles[status] || styles.watching
    const StatusIcon = style.icon
    
    return (
      <div
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        <StatusIcon className="w-3 h-3" />
        {status}
      </div>
    )
  }

  const containerClass = embedded
    ? 'w-full h-full flex flex-col'
    : 'fixed inset-0 flex items-center justify-center z-50 p-4'

  const innerClass = embedded
    ? 'rounded-xl p-6 w-full h-full overflow-hidden flex flex-col'
    : 'rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col'

  const Wrapper = ({ children }: { children: React.ReactNode }) => embedded ? (
    <div className={containerClass}>{children}</div>
  ) : (
    <div className={containerClass} style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>{children}</div>
  )

  return (
    <Wrapper>
      <div
        className={innerClass}
        style={{ backgroundColor: 'var(--sidebar)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
              My Orders
            </h2>
            <div className="text-sm mt-1" style={{ color: '#999' }}>
              Active and historical orders
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none"
            style={{ color: '#999' }}
          >
            ×
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: '#7B70FF' },
            { label: 'Active', value: stats.watching, color: '#FFB347' },
            { label: 'Filled', value: stats.filled, color: '#00C9A7' },
            { label: 'Cancelled', value: stats.cancelled, color: '#8B8FAD' },
            { label: 'Failed', value: stats.failed, color: '#FF6B6B' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg p-3 text-center"
              style={{ backgroundColor: 'var(--hover)' }}
            >
              <div className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-xs mt-1" style={{ color: '#999' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {['all', 'watching', 'filled', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: filter === f ? '#7B70FF' : 'var(--hover)',
                color: filter === f ? '#fff' : '#999',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-12" style={{ color: '#999' }}>
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12" style={{ color: '#999' }}>
              No orders found
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg p-4 transition-colors"
                style={{ backgroundColor: 'var(--hover)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mt-1"
                      style={{ backgroundColor: 'rgba(83,74,183,0.15)' }}
                    >
                      {getOrderIcon(order.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                          {order.type.replace('_', ' ').toUpperCase()}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="text-sm mb-2" style={{ color: '#999' }}>
                        {order.amountIn} {order.tokenIn} → {order.tokenOut}
                      </div>
                      
                      {order.triggerPrice && (
                        <div className="text-xs mb-1" style={{ color: '#7B70FF' }}>
                          Trigger: ${order.triggerPrice} {order.triggerCondition}
                        </div>
                      )}
                      
                      {order.dcaMaxExecutions && (
                        <div className="text-xs" style={{ color: '#00C9A7' }}>
                          DCA: {order.dcaExecutions || 0}/{order.dcaMaxExecutions} executions
                        </div>
                      )}
                      
                      <div className="text-xs mt-2" style={{ color: '#666' }}>
                        Created: {new Date(order.createdAt).toLocaleString()}
                      </div>
                      
                      {order.txHash && (
                        <a
                          href={`https://solscan.io/tx/${order.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline"
                          style={{ color: '#7B70FF' }}
                        >
                          View Transaction
                        </a>
                      )}
                    </div>
                  </div>

                  {order.status === 'watching' && (
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: '#FF6B6B' }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = 'rgba(255,107,107,0.15)')
                      }
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Wrapper>
  )
}
