'use client'

export interface ScheduledPayment {
  id: string
  fromWallet: string
  toAddress: string
  toDisplay: string
  token: string
  amount: number
  mint?: string
  decimals?: number
  scheduledAt: number   // unix ms — when to fire
  label: string         // human readable e.g. "April 15"
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  txSignature?: string
  createdAt: number
}

function key(wallet: string) { return `scheduled_payments_${wallet}` }

export function getScheduledPayments(wallet: string): ScheduledPayment[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(key(wallet)) || '[]') } catch { return [] }
}

export function saveScheduledPayment(wallet: string, p: Omit<ScheduledPayment, 'id' | 'createdAt'>): ScheduledPayment {
  const payments = getScheduledPayments(wallet)
  const entry: ScheduledPayment = { ...p, id: `sp_${Date.now()}`, createdAt: Date.now() }
  payments.push(entry)
  localStorage.setItem(key(wallet), JSON.stringify(payments))
  return entry
}

export function updateScheduledPayment(wallet: string, id: string, patch: Partial<ScheduledPayment>) {
  const payments = getScheduledPayments(wallet).map(p => p.id === id ? { ...p, ...patch } : p)
  localStorage.setItem(key(wallet), JSON.stringify(payments))
}

export function cancelScheduledPayment(wallet: string, id: string) {
  updateScheduledPayment(wallet, id, { status: 'cancelled' })
}

/** Parse a natural-language date string into a unix timestamp (ms) */
export function parseScheduleDate(text: string): { ts: number; label: string } | null {
  const now = new Date()
  const t = text.toLowerCase()

  // "15th of april", "april 15", "on april 15"
  const months: Record<string, number> = {
    january:0,february:1,march:2,april:3,may:4,june:5,
    july:6,august:7,september:8,october:9,november:10,december:11,
    jan:0,feb:1,mar:2,apr:3,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11
  }

  // Match "15th of april" or "april 15" or "15 april"
  const monthDay = t.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(\w+)/) ||
                   t.match(/(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?/)
  if (monthDay) {
    let day: number, monthName: string
    if (/^\d/.test(monthDay[1])) {
      day = parseInt(monthDay[1])
      monthName = monthDay[2]
    } else {
      monthName = monthDay[1]
      day = parseInt(monthDay[2])
    }
    const month = months[monthName]
    if (month !== undefined && day >= 1 && day <= 31) {
      const d = new Date(now.getFullYear(), month, day, 9, 0, 0) // 9am same year
      if (d < now) d.setFullYear(d.getFullYear() + 1) // next year if past
      return { ts: d.getTime(), label: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }
    }
  }

  // "tomorrow"
  if (t.includes('tomorrow')) {
    const d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(9,0,0,0)
    return { ts: d.getTime(), label: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) }
  }

  // "in 3 days"
  const inDays = t.match(/in\s+(\d+)\s+days?/)
  if (inDays) {
    const d = new Date(now); d.setDate(d.getDate() + parseInt(inDays[1])); d.setHours(9,0,0,0)
    return { ts: d.getTime(), label: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) }
  }

  // "next week"
  if (t.includes('next week')) {
    const d = new Date(now); d.setDate(d.getDate() + 7); d.setHours(9,0,0,0)
    return { ts: d.getTime(), label: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) }
  }

  return null
}
