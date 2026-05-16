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
    case 'open':   return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    case 'complete': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    case 'paid':   return 'text-gold-400 bg-gold-400/10 border-gold-400/20'
    case 'sent':   return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    default:       return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
  }
}

export function quoteStatusColor(status) {
  switch (status) {
    case 'draft':    return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    case 'sent':     return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    case 'accepted': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    case 'expired':  return 'text-red-400 bg-red-400/10 border-red-400/20'
    default:         return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
  }
}

export function formatSignedAmount(n) {
  const abs = Math.abs(n)
  return (n >= 0 ? '+' : '−') + abs
}
