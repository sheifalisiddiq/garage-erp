import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatAED(amount) {
  const n = Number(amount) || 0
  return 'AED ' + n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatElapsed(seconds) {
  if (!seconds && seconds !== 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

export function elapsedSeconds(createdAt) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
}

export function formatTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-AE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
  })
}

export function isToday(ts) {
  if (!ts) return false
  const d = new Date(ts)
  const now = new Date()
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
}

export function statusColor(status) {
  switch (status) {
    case 'open':     return 'status-badge-danger'
    case 'complete': return 'status-badge-ok'
    case 'paid':     return 'status-badge-ok'
    case 'sent':     return 'status-badge-danger'
    default:         return 'status-badge-neutral'
  }
}

export function quoteStatusColor(status) {
  switch (status) {
    case 'draft':    return 'status-badge-neutral'
    case 'sent':     return 'status-badge-danger'
    case 'accepted': return 'status-badge-ok'
    case 'expired':  return 'status-badge-danger'
    default:         return 'status-badge-neutral'
  }
}

export function formatSignedAmount(n) {
  const abs = Math.abs(n)
  return (n >= 0 ? '+' : '−') + abs
}

// ── UAE E-Invoicing VAT helpers ─────────────────────────────

// vatRate: -1 = Exempt, 0 = Zero-rated, 5 = Standard
export function calculateLineVat(amount, vatRate) {
  if (vatRate === -1 || vatRate === null || vatRate === undefined) {
    return { vatAmount: 0, lineTotal: Number(amount) }
  }
  const vatAmount = Math.round(Number(amount) * (vatRate / 100) * 100) / 100
  const lineTotal = Math.round((Number(amount) + vatAmount) * 100) / 100
  return { vatAmount, lineTotal }
}

export function calculateInvoiceTotals(services, parts) {
  let netAmount = 0
  let taxTotal = 0
  for (const s of services) {
    const cost = Number(s.service_cost)
    netAmount += cost
    taxTotal += calculateLineVat(cost, s.vat_rate ?? 0).vatAmount
  }
  for (const p of parts) {
    const cost = Number(p.part_cost) * p.quantity
    netAmount += cost
    taxTotal += calculateLineVat(cost, p.vat_rate ?? 0).vatAmount
  }
  netAmount = Math.round(netAmount * 100) / 100
  taxTotal = Math.round(taxTotal * 100) / 100
  const payableAmount = Math.round((netAmount + taxTotal) * 100) / 100
  return { netAmount, taxTotal, payableAmount }
}

export function groupTaxByCategory(services, parts) {
  const cats = {}
  const add = (amount, vatRate) => {
    const key = vatRate === -1 ? 'E' : vatRate === 0 ? 'Z' : 'S'
    const { vatAmount } = calculateLineVat(amount, vatRate)
    if (!cats[key]) cats[key] = { category: key, taxableAmt: 0, rate: vatRate === -1 ? null : vatRate, taxAmt: 0 }
    cats[key].taxableAmt = Math.round((cats[key].taxableAmt + amount) * 100) / 100
    cats[key].taxAmt = Math.round((cats[key].taxAmt + vatAmount) * 100) / 100
  }
  for (const s of services) add(Number(s.service_cost), s.vat_rate ?? 0)
  for (const p of parts) add(Number(p.part_cost) * p.quantity, p.vat_rate ?? 0)
  return Object.values(cats)
}

export function vatCategoryLabel(cat) {
  if (cat === 'S') return 'Standard (S)'
  if (cat === 'Z') return 'Zero Rate (Z)'
  return 'Exempt (E)'
}

export function vatRateLabel(vatRate) {
  if (vatRate === -1) return 'Exempt'
  return `${vatRate}%`
}
