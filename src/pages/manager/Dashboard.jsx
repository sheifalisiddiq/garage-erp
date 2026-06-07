import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { cn, formatAED, formatElapsed, formatTime, isToday } from '../../lib/utils'
import { RefreshCw, Plus, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

/* ── Helpers ─────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function fmtRevenue(n) {
  const [whole, cents] = Number(n || 0).toFixed(2).split('.')
  return {
    whole: Number(whole).toLocaleString('en-US'),
    cents,
  }
}

function progressFromElapsed(createdAt) {
  const secs = (Date.now() - new Date(createdAt).getTime()) / 1000
  return Math.min(secs / (4 * 3600), 0.92)
}

function statusBadgeClass(cls) {
  switch (cls) {
    case 'in-progress': return 'status-badge-danger'
    case 'complete':    return 'status-badge-ok'
    case 'paid':        return 'status-badge-ok'
    case 'invoiced':    return 'status-badge-danger'
    default:            return 'status-badge-neutral'
  }
}

/* ── Dashboard skeleton loader ───────────────────────── */
function DashboardSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-7 w-80 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>
      <div className="top-grid">
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
      </div>
      <Skeleton className="h-72 rounded-2xl" />
      <div className="bottom-grid">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </>
  )
}

/* ── Sparkline ───────────────────────────────────────── */
function Sparkline({ points, dir }) {
  const W = 90, H = 32
  const max = Math.max(...points), min = Math.min(...points)
  const xs = points.map((v, i) => {
    const x = (i / (points.length - 1)) * W
    const y = H - ((v - min) / (max - min || 1)) * (H - 6) - 3
    return [x, y]
  })
  const d = xs.map(([x, y], i) => (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' ')
  const color = dir === 'up' ? 'var(--ok)' : 'var(--danger)'
  const [endX, endY] = xs[xs.length - 1]
  return (
    <span className="spark">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <path d={d} stroke={color} strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={endX} cy={endY} r="3" fill={color} />
        <circle cx={endX} cy={endY} r="6" fill={color} opacity="0.25" />
      </svg>
    </span>
  )
}

/* generate deterministic sparkline from a job id + amount */
function makeSpark(id, amount) {
  const seed = String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0) + amount
  const points = Array.from({ length: 8 }, (_, i) => {
    const v = ((Math.sin((seed + i * 37) * 0.3) + 1) * 5) + 3
    return Math.round(v * 10) / 10
  })
  const first = points[0], last = points[points.length - 1]
  return { points, dir: last >= first ? 'up' : 'down' }
}

/* ── Revenue chart ───────────────────────────────────── */
const RANGE_KEYS = ['1D', '1W', '1M', '6M', '1Y']

function smooth(p) {
  if (p.length < 2) return ''
  let d = `M ${p[0].x} ${p[0].y}`
  for (let i = 0; i < p.length - 1; i++) {
    const cp1x = p[i].x + (p[i + 1].x - (p[i - 1]?.x || p[i].x)) / 6
    const cp1y = p[i].y + (p[i + 1].y - (p[i - 1]?.y || p[i].y)) / 6
    const cp2x = p[i + 1].x - ((p[i + 2]?.x || p[i + 1].x) - p[i].x) / 6
    const cp2y = p[i + 1].y - ((p[i + 2]?.y || p[i + 1].y) - p[i].y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p[i + 1].x} ${p[i + 1].y}`
  }
  return d
}

function fmtK(v) {
  if (v >= 1000) return (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'K'
  return String(Math.round(v))
}

function PerformanceChart({ chartData }) {
  const [range, setRange] = useState('6M')
  const wrapRef = useRef(null)

  const { labels, values } = useMemo(() => {
    const d = chartData[range] || { labels: [], values: [] }
    return d
  }, [chartData, range])

  const W = 1000, H = 260, P = { l: 56, r: 16, t: 22, b: 36 }
  const innerW = W - P.l - P.r
  const innerH = H - P.t - P.b
  const maxVal = Math.max(...values, 1) * 1.18

  const pts = values.map((v, i) => ({
    x: P.l + (values.length > 1 ? (i / (values.length - 1)) * innerW : innerW / 2),
    y: P.t + innerH - (v / maxVal) * innerH,
    v, label: labels[i] || '',
  }))

  const defaultIdx = Math.max(0, Math.floor(pts.length / 2) - 1)
  const [hoverIdx, setHoverIdx] = useState(defaultIdx)

  useEffect(() => {
    setHoverIdx(Math.max(0, Math.floor(pts.length / 2) - 1))
  }, [range, pts.length])

  const onMove = (e) => {
    if (!wrapRef.current || pts.length === 0) return
    const rect = wrapRef.current.getBoundingClientRect()
    const xPct = (e.clientX - rect.left) / rect.width
    const idx = Math.max(0, Math.min(pts.length - 1, Math.round(xPct * (pts.length - 1))))
    setHoverIdx(idx)
  }

  const linePath = pts.length > 0 ? smooth(pts) : ''
  const areaPath = pts.length > 0
    ? linePath + ` L ${pts[pts.length - 1].x} ${P.t + innerH} L ${pts[0].x} ${P.t + innerH} Z`
    : ''

  const pt = pts[hoverIdx] || { x: 0, y: 0, v: 0, label: '' }
  const tipLeft = pts.length > 0 ? (pt.x / W) * 100 : 50
  const tipTop  = pts.length > 0 ? (pt.y / H) * 100 : 50

  const prevVal = values[Math.max(0, hoverIdx - 1)] || values[0] || 1
  const pctChange = prevVal > 0 ? ((pt.v / prevVal - 1) * 100).toFixed(1) : '0.0'

  const yTicks = useMemo(() => {
    const t = []
    for (let i = 0; i <= 4; i++) {
      const v = (maxVal / 4) * i
      const y = P.t + innerH - (v / maxVal) * innerH
      t.push({ y, v })
    }
    return t
  }, [maxVal])

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Revenue Performance</div>
          <div className="card-sub">Net revenue · paid invoices</div>
        </div>
        <div className="chart-time-row">
          {RANGE_KEYS.map(r => (
            <button
              key={r}
              className={'chip' + (range === r ? ' is-active' : '')}
              onClick={() => setRange(r)}
              style={{ minWidth: 38, justifyContent: 'center' }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrap" ref={wrapRef} onMouseMove={onMove}>
        <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#e11d48" stopOpacity="0.32" />
              <stop offset="60%"  stopColor="#e11d48" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>

          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={P.l} y1={t.y} x2={W - P.r} y2={t.y}
                stroke="var(--chart-grid)" strokeDasharray="3 6" />
              <text x={P.l - 12} y={t.y + 4} fill="var(--chart-axis)"
                fontSize="10.5" textAnchor="end" fontFamily="var(--font-mono)">
                AED {fmtK(t.v)}
              </text>
            </g>
          ))}

          {pts.map((p, i) => (
            <text key={i} x={p.x} y={H - 12} fill="var(--chart-axis)"
              fontSize="10.5" textAnchor="middle">
              {p.label}
            </text>
          ))}

          {pts.length > 0 && <path d={areaPath} fill="url(#areaGrad)" />}
          {pts.length > 0 && (
            <path d={linePath} stroke="url(#lineGrad)" strokeWidth="2.4"
              fill="none" strokeLinecap="round" />
          )}

          {pts.length > 0 && (
            <>
              <line x1={pt.x} y1={P.t} x2={pt.x} y2={P.t + innerH}
                stroke="#e11d48" strokeDasharray="4 4" strokeWidth="1" opacity="0.6" />
              <circle cx={pt.x} cy={pt.y} r="9" fill="#e11d48" fillOpacity="0.2" />
              <circle cx={pt.x} cy={pt.y} r="5" fill="#e11d48"
                stroke="var(--card)" strokeWidth="2.5" />
            </>
          )}
        </svg>

        {pts.length > 0 && (
          <div className="chart-tooltip"
            style={{ left: `calc(${tipLeft}% - 70px)`, top: `calc(${tipTop}% - 70px)` }}>
            <div className="chart-tooltip-label">{pt.label}</div>
            <div className="chart-tooltip-value mono">
              AED {pt.v.toLocaleString('en-AE', { maximumFractionDigits: 0 })}
              <span className={'delta ' + (Number(pctChange) >= 0 ? 'up' : 'down')}
                style={{ fontSize: 10 }}>
                {Number(pctChange) >= 0 ? '↑' : '↓'}{Math.abs(Number(pctChange))}%
              </span>
            </div>
          </div>
        )}

        {pts.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'grid',
            placeItems: 'center', color: 'var(--text-dim)', fontSize: 13,
          }}>
            No revenue data for this period
          </div>
        )}
      </div>
    </section>
  )
}

const TIME_FILTERS = ['Today', 'Week', 'Month']

/* ── Hero Revenue card ───────────────────────────────────── */
function HeroRevenue({ revenueToday, openJobs, avgTicket, revenuePending, revenueYesterday, allJobs, allInvoices }) {
  const [timeFilter, setTimeFilter] = useState('Today')

  const { revenue, avg } = useMemo(() => {
    if (timeFilter === 'Today' || !allJobs || !allInvoices) {
      return { revenue: revenueToday, avg: avgTicket }
    }
    const now = new Date()
    const cutoff = timeFilter === 'Week'
      ? new Date(now - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getFullYear(), now.getMonth(), 1)
    const invMap = {}
    allInvoices.forEach(i => { invMap[i.job_id] = i })
    const paidInPeriod = allJobs.filter(j =>
      j.status === 'complete' &&
      invMap[j.id]?.status === 'paid' &&
      new Date(invMap[j.id].created_at) >= cutoff
    )
    const rev = paidInPeriod.reduce((s, j) => s + Number(invMap[j.id]?.total_amount || 0), 0)
    return { revenue: rev, avg: paidInPeriod.length > 0 ? rev / paidInPeriod.length : 0 }
  }, [timeFilter, allJobs, allInvoices, revenueToday, avgTicket])

  const { whole, cents } = fmtRevenue(revenue)

  const revDelta = timeFilter === 'Today' && revenueYesterday > 0
    ? (revenue - revenueYesterday) / revenueYesterday * 100
    : null
  const revDeltaAbs = timeFilter === 'Today' ? revenue - revenueYesterday : null
  const bayUtil = Math.min(100, Math.round((Math.min(openJobs, 3) / 3) * 100))

  const stats = [
    { label: 'Active Jobs',     value: String(openJobs) },
    { label: 'Avg. Ticket',     value: avg > 0 ? `AED ${Math.round(avg).toLocaleString()}` : '—' },
    { label: 'Pending Invoice', value: revenuePending > 0 ? `AED ${(revenuePending / 1000).toFixed(1)}K` : '—' },
    { label: 'Bay Utilization', value: `${bayUtil}%` },
  ]

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-head" style={{ marginBottom: 14 }}>
        <div className="card-title">{timeFilter === 'Today' ? "Today's" : timeFilter === 'Week' ? "This Week's" : "This Month's"} Revenue</div>
        <button
          className="chip"
          style={{ fontSize: 11 }}
          onClick={() => setTimeFilter(f => TIME_FILTERS[(TIME_FILTERS.indexOf(f) + 1) % TIME_FILTERS.length])}
        >
          {timeFilter} <span style={{ fontSize: 9 }}>▾</span>
        </button>
      </div>

      {/* Hero number */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, margin: '4px 0 10px' }}>
        <span style={{
          fontSize: 14, fontWeight: 600, color: 'var(--text-dim)',
          fontFamily: 'var(--font-sans)', paddingBottom: 11, letterSpacing: '0.02em',
        }}>AED</span>
        <span style={{
          fontSize: 54, fontWeight: 800, letterSpacing: '-0.045em',
          color: 'var(--text)', lineHeight: 1, fontFamily: 'var(--font-sans)',
        }}>{whole}</span>
        <span style={{
          fontSize: 27, fontWeight: 600, color: 'var(--text-muted)',
          fontFamily: 'var(--font-sans)', paddingBottom: 5,
        }}>.{cents}</span>
      </div>

      {/* Return / delta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Return</span>
        {revDelta !== null ? (
          <span className={'delta ' + (revDelta >= 0 ? 'up' : 'down')}>
            {revDelta >= 0 ? '↑' : '↓'}{' '}{Math.abs(revDelta).toFixed(1)}%
            {' '}({revDeltaAbs >= 0 ? '+' : '-'}AED {Math.abs(Math.round(revDeltaAbs)).toLocaleString()})
          </span>
        ) : (
          <span className="delta up">↑ —</span>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>· vs yesterday</span>
      </div>

      {/* stat strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        borderTop: '1px solid var(--border)', marginTop: 'auto',
      }}>
        {stats.map((s, idx) => (
          <div key={s.label} style={{
            padding: '14px 0 0',
            paddingLeft: idx > 0 ? 16 : 0,
            borderLeft: idx > 0 ? '1px solid var(--border)' : 'none',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{
              fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.09em', color: 'var(--text-dim)',
            }}>{s.label}</div>
            <div style={{
              fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em',
              color: 'var(--text)', fontVariantNumeric: 'tabular-nums',
            }}>{s.value}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Active bays card ─────────────────────────────────── */
function BayCard({ bay, idx }) {
  return (
    <div className="bay">
      <div className="bay-head">
        <span className="bay-tag">Bay {String(idx + 1).padStart(2, '0')}</span>
        <span className={'bay-status ' + bay.statusClass}>{bay.statusLabel}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="brand-logo">{bay.mark}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="bay-vehicle" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {bay.vehicle}
          </div>
          <div className="bay-job">{bay.year} · {bay.plate}</div>
        </div>
      </div>

      <div className="bay-job" style={{ color: 'var(--text)', fontWeight: 500 }}>
        {bay.job}
      </div>

      <Progress value={bay.progress * 100} className="h-1.5" />

      <div className="bay-meta">
        <span className="bay-eta">
          <b>{bay.eta}</b> elapsed
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }} className="mono">
          {Math.round(bay.progress * 100)}%
        </span>
      </div>
    </div>
  )
}

function FreeBay({ idx }) {
  return (
    <div className="bay" style={{ opacity: 0.55 }}>
      <div className="bay-head">
        <span className="bay-tag">Bay {String(idx + 1).padStart(2, '0')}</span>
        <span className="bay-status free">Available</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 60 }}>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>No active job</span>
      </div>
    </div>
  )
}

function ActiveBays({ openJobs, totalBays = 3 }) {
  const navigate = useNavigate()
  const bays = openJobs.slice(0, totalBays).map(job => ({
    vehicle: `${job.vehicles?.make || ''} ${job.vehicles?.model || ''}`.trim() || 'Unknown Vehicle',
    year:    job.vehicles?.year || '—',
    plate:   job.vehicles?.license_plate || '—',
    job:     (job.job_services?.[0]?.service_name) || 'Service in progress',
    mark:    (job.vehicles?.make?.[0] || '?').toUpperCase(),
    eta:     formatElapsed(Math.floor((Date.now() - new Date(job.created_at).getTime()) / 1000)),
    progress: progressFromElapsed(job.created_at),
    statusClass: 'working',
    statusLabel: 'In service',
  }))

  const inService = bays.filter(b => b.statusClass === 'working').length
  const freeBays  = Math.max(0, totalBays - bays.length)

  return (
    <section className="card" style={{ padding: '20px 22px' }}>
      <div className="card-head">
        <div>
          <div className="card-title">Active Bays</div>
          <div className="card-sub">
            {totalBays} bays · {inService} in service · {freeBays} available
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="chip" onClick={() => navigate('/receptionist/new-job')}><Plus size={12} /> Assign job</button>
          <button className="chip" onClick={() => navigate('/manager/jobs')}>See all <ArrowUpRight size={12} /></button>
        </div>
      </div>

      <div className="bays-row">
        {bays.map((bay, i) => <BayCard key={i} bay={bay} idx={i} />)}
        {Array.from({ length: freeBays }).map((_, i) => (
          <FreeBay key={'free-' + i} idx={bays.length + i} />
        ))}
      </div>
    </section>
  )
}

/* ── Jobs table ──────────────────────────────────────── */
const JOB_FILTERS = ['All', 'Active', 'Complete', 'Invoiced']

function jobStatus(job, invoices) {
  if (job.status === 'open')     return { cls: 'in-progress', label: 'In progress' }
  if (job.status === 'complete') {
    const inv = invoices[job.id]
    if (inv?.status === 'paid') return { cls: 'paid',     label: 'Paid' }
    if (inv)                    return { cls: 'invoiced', label: 'Invoiced' }
    return { cls: 'complete', label: 'Complete' }
  }
  return { cls: 'complete', label: job.status }
}

function JobsTable({ todayJobs, invoices }) {
  const [filter, setFilter] = useState('All')

  const visible = todayJobs.filter(j => {
    if (filter === 'All')      return true
    if (filter === 'Active')   return j.status === 'open'
    if (filter === 'Complete') return j.status === 'complete'
    if (filter === 'Invoiced') return j.status === 'complete' && invoices[j.id]
    return true
  })

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Today's Jobs</div>
          <div className="card-sub">Bay activity · last 24h</div>
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="h-8 p-0.5">
            {JOB_FILTERS.map(f => (
              <TabsTrigger key={f} value={f} className="h-7 px-3 text-xs">{f}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <table className="jobs-table">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Service</th>
            <th>Customer</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
            <th style={{ textAlign: 'right' }}>Trend</th>
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '24px 0' }}>
                No jobs match this filter
              </td>
            </tr>
          )}
          {visible.map(job => {
            const { cls, label } = jobStatus(job, invoices)
            const inv = invoices[job.id]
            const amount = Number(inv?.total_amount || 0)
            const spark = makeSpark(job.id, amount)
            const serviceName = job.job_services?.[0]?.service_name || 'Service'
            const etaText = job.status === 'open'
              ? formatElapsed(Math.floor((Date.now() - new Date(job.created_at).getTime()) / 1000))
              : formatTime(job.updated_at || job.created_at)
            const mark = (job.vehicles?.make?.[0] || '?').toUpperCase()

            return (
              <tr key={job.id}>
                <td>
                  <div className="job-vehicle">
                    <div className="brand-logo" style={{ width: 32, height: 32, borderRadius: 9, fontSize: 13 }}>
                      {mark}
                    </div>
                    <div>
                      <div className="job-vehicle-name">
                        {job.vehicles?.make} {job.vehicles?.model}
                      </div>
                      <div className="job-vehicle-meta mono">
                        {job.vehicles?.license_plate || job.job_number}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{serviceName}</div>
                  <div className="job-vehicle-meta">{etaText}</div>
                </td>
                <td>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {job.customers?.name || '—'}
                  </span>
                </td>
                <td>
                  <Badge variant="outline" className={cn('text-xs font-semibold', statusBadgeClass(cls))}>
                    {label}
                  </Badge>
                </td>
                <td
                  style={{
                    textAlign: 'right',
                    color: amount > 0 ? (inv?.status === 'paid' ? 'var(--ok)' : 'var(--danger)') : 'var(--text-dim)',
                  }}
                  className="font-medium"
                >
                  {amount > 0 ? formatAED(amount) : '—'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Sparkline points={spark.points} dir={spark.dir} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

/* ── Pending invoices panel (right column) ─────────────── */
function PendingPanel({ pendingInvoices, mechPerf }) {
  const [tab, setTab] = useState('invoices')
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <div className="card-title">{tab === 'invoices' ? 'Pending Payment' : 'Mechanics'}</div>
          <div className="card-sub">
            {tab === 'invoices' ? 'Outstanding invoices' : "Today's performance"}
          </div>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-8 p-0.5">
            <TabsTrigger value="invoices" className="h-7 px-3 text-xs">Invoices</TabsTrigger>
            <TabsTrigger value="mechs" className="h-7 px-3 text-xs">Mechanics</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {tab === 'invoices' && (
        <div className="upnext-list">
          {pendingInvoices.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-dim)', fontSize: 13 }}>
              All invoices paid ✓
            </div>
          )}
          {pendingInvoices.map((inv) => {
            const job = inv._job
            return (
              <div key={inv.id} className="upnext-item">
                <div className="upnext-time mono">
                  {formatTime(inv.created_at)}
                  <small>{new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="upnext-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {job?.vehicles?.make} {job?.vehicles?.model}
                  </div>
                  <div className="upnext-sub">{job?.customers?.name || '—'}</div>
                </div>
                <span className="upnext-tag" style={{ color: 'var(--danger)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {formatAED(inv.total_amount)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'mechs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mechPerf.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-dim)', fontSize: 13 }}>
              No mechanic data today
            </div>
          )}
          {mechPerf.map(m => {
            const initials = m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            return (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar className={cn(
                  'h-9 w-9 shrink-0',
                  m.activeJob ? 'ring-1 ring-brand-400/40' : ''
                )}>
                  <AvatarFallback className={cn(
                    'text-xs font-bold',
                    m.activeJob
                      ? 'bg-brand-400/15 text-brand-400'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {m.jobs} job{m.jobs !== 1 ? 's' : ''}
                    {m.revenue > 0 && <span style={{ color: 'var(--ok)', marginLeft: 6 }}>{formatAED(m.revenue)}</span>}
                    {m.activeJob && <span style={{ color: 'var(--info)', marginLeft: 6 }}>· {m.activeJob}</span>}
                  </div>
                </div>
                {m.activeJob && (
                  <div style={{
                    width: 8, height: 8, borderRadius: 999,
                    background: 'var(--info)',
                    boxShadow: '0 0 8px var(--info)',
                  }} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

/* ── Build chart series from invoices ────────────────── */
function buildChartData(allInvoices) {
  const now = new Date()

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayNames   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  function groupByMonth(months) {
    const cutoff = new Date(now)
    cutoff.setMonth(cutoff.getMonth() - months)
    const map = {}
    for (let i = 0; i < months; i++) {
      const d = new Date(now)
      d.setMonth(d.getMonth() - (months - 1 - i))
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
      map[key] = { label: monthNames[d.getMonth()], value: 0 }
    }
    allInvoices.forEach(inv => {
      if (inv.status !== 'paid') return
      const d = new Date(inv.created_at)
      if (d < cutoff) return
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
      if (map[key]) map[key].value += Number(inv.total_amount || 0)
    })
    const entries = Object.values(map)
    return { labels: entries.map(e => e.label), values: entries.map(e => e.value) }
  }

  function groupByDay(days) {
    const map = {}
    for (let i = 0; i < days; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - (days - 1 - i))
      const key = d.toDateString()
      map[key] = {
        label: days <= 7 ? dayNames[d.getDay()] : `${monthNames[d.getMonth()]} ${d.getDate()}`,
        value: 0,
      }
    }
    allInvoices.forEach(inv => {
      if (inv.status !== 'paid') return
      const d = new Date(inv.created_at)
      const key = d.toDateString()
      if (map[key]) map[key].value += Number(inv.total_amount || 0)
    })
    const entries = Object.values(map)
    return { labels: entries.map(e => e.label), values: entries.map(e => e.value) }
  }

  function groupByHour() {
    const labels = ['6a','7a','8a','9a','10a','11a','12p','1p','2p','3p','4p','5p','6p','7p','8p']
    const values = labels.map((_, i) => {
      const hr = 6 + i
      return allInvoices
        .filter(inv => {
          if (inv.status !== 'paid') return false
          const d = new Date(inv.created_at)
          return isToday(inv.created_at) && d.getHours() === hr
        })
        .reduce((s, inv) => s + Number(inv.total_amount || 0), 0)
    })
    return { labels, values }
  }

  return {
    '1D': groupByHour(),
    '1W': groupByDay(7),
    '1M': groupByDay(30),
    '6M': groupByMonth(6),
    '1Y': groupByMonth(12),
  }
}

/* ── Main dashboard ──────────────────────────────────── */
export default function ManagerDashboard() {
  const { user } = useAuth()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [rawJobs, setRawJobs] = useState([])
  const [rawInvoices, setRawInvoices] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = useCallback(async () => {
    const yearAgo = new Date()
    yearAgo.setFullYear(yearAgo.getFullYear() - 1)

    const [jobsRes, invoicesRes, mechanicsRes] = await Promise.all([
      supabase
        .from('jobs')
        .select('*, customers(name,phone), vehicles(make,model,year,license_plate), mechanics(name), job_services(*), job_parts(*)')
        .order('created_at', { ascending: false }),
      supabase
        .from('invoices')
        .select('*')
        .gte('created_at', yearAgo.toISOString())
        .order('created_at', { ascending: false }),
      supabase
        .from('mechanics')
        .select('*')
        .eq('status', 'active'),
    ])

    const jobs      = jobsRes.data     || []
    const invoices  = invoicesRes.data || []
    const mechanics = mechanicsRes.data || []
    setRawJobs(jobs)
    setRawInvoices(invoices)

    const invMap = {}
    invoices.forEach(inv => { invMap[inv.job_id] = inv })

    const todayJobs       = jobs.filter(j => isToday(j.created_at))
    const openJobs        = jobs.filter(j => j.status === 'open')
    const completedToday  = todayJobs.filter(j => j.status === 'complete')
    const paidToday       = completedToday.filter(j => invMap[j.id]?.status === 'paid')
    const pendingInvoices = invoices
      .filter(i => i.status === 'sent')
      .map(i => ({ ...i, _job: jobs.find(j => j.id === i.job_id) }))

    const revenueToday    = paidToday.reduce((s, j) => s + Number(invMap[j.id]?.total_amount || 0), 0)
    const revenuePending  = pendingInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0)

    const avgTicket = paidToday.length > 0
      ? revenueToday / paidToday.length
      : 0

    const mechPerf = {}
    mechanics.forEach(m => { mechPerf[m.id] = { name: m.name, jobs: 0, revenue: 0, activeJob: null } })
    completedToday.forEach(j => {
      if (j.mechanic_id && mechPerf[j.mechanic_id]) {
        mechPerf[j.mechanic_id].jobs++
        mechPerf[j.mechanic_id].revenue += Number(invMap[j.id]?.total_amount || 0)
      }
    })
    openJobs.forEach(j => {
      if (j.mechanic_id && mechPerf[j.mechanic_id]) {
        mechPerf[j.mechanic_id].activeJob = j.job_number
      }
    })

    const isYest = d => {
      const y = new Date(); y.setDate(y.getDate() - 1)
      return new Date(d).toDateString() === y.toDateString()
    }
    const paidYesterday = jobs.filter(j => isYest(j.created_at) && j.status === 'complete' && invMap[j.id]?.status === 'paid')
    const revenueYesterday = paidYesterday.reduce((s, j) => s + Number(invMap[j.id]?.total_amount || 0), 0)

    const chartData = buildChartData(invoices)

    setData({
      todayJobs, openJobs, completedToday, paidToday,
      pendingInvoices, revenueToday, revenuePending, avgTicket, revenueYesterday,
      invoices: invMap,
      mechPerf: Object.values(mechPerf).sort((a, b) => b.jobs - a.jobs || b.revenue - a.revenue),
      chartData,
    })
    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const ch = supabase.channel('manager-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_services' }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [fetchData])

  if (loading || !data) {
    return <DashboardSkeleton />
  }

  const firstName = user?.name?.split(' ')[0] || 'there'
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <>
      {/* ── Page header ─────────────────────────────────── */}
      <div className="animate-fade-up stagger-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
            {dateLabel}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '6px 0 0', color: 'var(--text)' }}>
            {getGreeting()}, {firstName}.{' '}
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
              {data.openJobs.length > 0
                ? `${data.openJobs.length} job${data.openJobs.length !== 1 ? 's' : ''} active.`
                : 'All clear.'}
            </span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastUpdated && (
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
              Updated at {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button className="chip" onClick={fetchData}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Top grid: Revenue hero + Active Bays ────────────── */}
      <div className="top-grid animate-fade-up stagger-2">
        <HeroRevenue
          revenueToday={data.revenueToday}
          openJobs={data.openJobs.length}
          avgTicket={data.avgTicket}
          revenuePending={data.revenuePending}
          revenueYesterday={data.revenueYesterday}
          allJobs={rawJobs}
          allInvoices={rawInvoices}
        />
        <ActiveBays openJobs={data.openJobs} totalBays={3} />
      </div>

      {/* ── Revenue chart ────────────────────────────────── */}
      <div className="animate-fade-up stagger-3"><PerformanceChart chartData={data.chartData} /></div>

      {/* ── Bottom grid: jobs table + pending ───────────── */}
      <div className="bottom-grid animate-fade-up stagger-4">
        <JobsTable todayJobs={data.todayJobs} invoices={data.invoices} />
        <PendingPanel pendingInvoices={data.pendingInvoices} mechPerf={data.mechPerf} />
      </div>
    </>
  )
}
