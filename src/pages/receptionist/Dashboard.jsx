import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useSearch } from '../../context/SearchContext'
import { cn, formatAED, formatElapsed, elapsedSeconds, formatTime, statusColor } from '../../lib/utils'
import { PlusCircle, Clock, Car, User, Wrench, RefreshCw, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

function LiveTimer({ createdAt }) {
  const [secs, setSecs] = useState(elapsedSeconds(createdAt))
  useEffect(() => {
    const t = setInterval(() => setSecs(elapsedSeconds(createdAt)), 1000)
    return () => clearInterval(t)
  }, [createdAt])
  return <span className="font-mono text-sm font-semibold" style={{ color: 'var(--accent-400)' }}>{formatElapsed(secs)}</span>
}


function JobCard({ job, invoice, onClick }) {
  const isOpen = job.status === 'open'
  const isPaid = invoice?.status === 'paid'
  const isPending = invoice?.status === 'sent'

  return (
    <div
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      className="group"
    >
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '14px 16px',
        transition: 'border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(var(--accent-glow)/0.3)'
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 6px 20px -8px rgba(0,0,0,0.14)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: 'var(--accent-400)',
                background: 'rgba(var(--accent-glow)/0.10)',
                padding: '2px 8px', borderRadius: 6, letterSpacing: '0.02em',
              }}>
                {job.job_number}
              </span>
              <Badge variant="outline" className={cn('text-xs font-semibold', statusColor(job.status))}>
                {isOpen ? 'In Progress' : 'Complete'}
              </Badge>
              {invoice && (
                <Badge variant="outline" className={cn('text-xs font-semibold', statusColor(invoice.status))}>
                  {isPaid ? 'Paid' : isPending ? 'Awaiting Payment' : invoice.status}
                </Badge>
              )}
            </div>

            {/* Customer & vehicle */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginBottom: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)' }}>
                <User size={12} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                {job.customers?.name}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)' }}>
                <Car size={12} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                {job.vehicles?.make} {job.vehicles?.model}
                <span style={{ color: 'var(--text-faint)', margin: '0 2px' }}>·</span>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{job.vehicles?.license_plate}</span>
              </span>
            </div>

            {/* Mechanic */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-dim)' }}>
              <Wrench size={11} style={{ flexShrink: 0 }} />
              {job.mechanics?.name}
              {job.description && (
                <>
                  <span style={{ color: 'var(--text-faint)' }}>·</span>
                  <span style={{ color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{job.description}</span>
                </>
              )}
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            {isOpen ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={13} style={{ color: 'var(--accent-400)' }} />
                <LiveTimer createdAt={job.created_at} />
              </div>
            ) : invoice ? (
              <span style={{ fontSize: 14, fontWeight: 700, color: invoice.status === 'paid' ? 'var(--ok)' : 'var(--danger)' }}>{formatAED(invoice.total_amount)}</span>
            ) : null}
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{formatTime(job.created_at)}</span>
            <ChevronRight size={15} style={{ color: 'var(--text-faint)', transition: 'color 160ms ease, transform 160ms ease' }}
              className="group-hover:text-brand-400"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const FILTERS = ['all', 'open', 'complete', 'paid', 'pending']

export default function ReceptionistDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { search } = useSearch()
  const [jobs, setJobs] = useState([])
  const [invoices, setInvoices] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchJobs = useCallback(async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select(`*, customers(name, phone, email), vehicles(make, model, license_plate, year), mechanics(name)`)
      .order('created_at', { ascending: false })

    if (error) { console.error(error); return }
    setJobs(data || [])

    if (data?.length) {
      const jobIds = data.map(j => j.id)
      const { data: invData } = await supabase.from('invoices').select('*').in('job_id', jobIds)
      const invMap = {}
      invData?.forEach(inv => { invMap[inv.job_id] = inv })
      setInvoices(invMap)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchJobs()
    const channel = supabase
      .channel('receptionist-jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchJobs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchJobs)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchJobs])

  const todayJobs = jobs.filter(j => new Date(j.created_at).toDateString() === new Date().toDateString())
  const openJobs = todayJobs.filter(j => j.status === 'open')
  const completedToday = todayJobs.filter(j => j.status === 'complete')
  const todayRevenue = completedToday.reduce((sum, j) => {
    const inv = invoices[j.id]
    return sum + (inv?.status === 'paid' ? Number(inv.total_amount) : 0)
  }, 0)
  const pendingPayment = Object.values(invoices).filter(i => i.status === 'sent').length

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      j.job_number?.toLowerCase().includes(q) ||
      j.customers?.name?.toLowerCase().includes(q) ||
      j.vehicles?.license_plate?.toLowerCase().includes(q) ||
      j.vehicles?.make?.toLowerCase().includes(q) ||
      j.vehicles?.model?.toLowerCase().includes(q)
    const matchFilter =
      filter === 'all' ||
      (filter === 'open' && j.status === 'open') ||
      (filter === 'complete' && j.status === 'complete') ||
      (filter === 'paid' && invoices[j.id]?.status === 'paid') ||
      (filter === 'pending' && invoices[j.id]?.status === 'sent')
    return matchSearch && matchFilter
  })

  const statsConfig = [
    { label: 'Active Jobs',      value: openJobs.length },
    { label: 'Done Today',       value: completedToday.length },
    { label: "Today's Revenue",  value: formatAED(todayRevenue) },
    { label: 'Pending Payment',  value: pendingPayment },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.01em' }}>
            {openJobs.length} active · {completedToday.length} done today
          </p>
        </div>
        <button
          onClick={() => navigate('/receptionist/new-job')}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--accent-500)',
            color: 'var(--accent-text)',
            border: 0, borderRadius: 12, cursor: 'pointer',
            padding: '9px 16px', fontSize: 13, fontWeight: 600,
            fontFamily: 'inherit', flexShrink: 0,
            boxShadow: '0 6px 18px -6px rgba(var(--accent-glow)/0.45)',
            transition: 'background 150ms ease, opacity 150ms ease, transform 150ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <PlusCircle size={15} />
          <span>New Job</span>
        </button>
      </div>

      {/* Stats */}
      <div className="kpi-strip">
        {statsConfig.flatMap((s, i) => [
          ...(i > 0 ? [<div key={`d${i}`} className="kpi-div" />] : []),
          <div key={s.label} className="kpi-item">
            <span className="kpi-label">{s.label}</span>
            <span className="kpi-value">{s.value}</span>
          </div>,
        ])}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="h-9 p-1">
            {FILTERS.map(f => {
              const count = f === 'all' ? jobs.length
                : f === 'open'     ? jobs.filter(j => j.status === 'open').length
                : f === 'complete' ? jobs.filter(j => j.status === 'complete').length
                : f === 'paid'     ? jobs.filter(j => invoices[j.id]?.status === 'paid').length
                : jobs.filter(j => invoices[j.id]?.status === 'sent').length
              return (
                <TabsTrigger key={f} value={f} className="h-7 px-3 text-xs capitalize gap-1.5">
                  {f}
                  {count > 0 && (
                    <span className="text-2xs opacity-55 tabular-nums">{count}</span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
        <button
          onClick={fetchJobs}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 10,
            background: 'var(--pill-bg)', border: '1px solid var(--border)',
            color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12, fontWeight: 500,
            fontFamily: 'inherit', transition: 'all 150ms ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
          title="Refresh jobs"
          aria-label="Refresh jobs"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Search feedback */}
      {search && (
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: -8 }}>
          {filtered.length === 0 ? 'No results' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`} for "{search}"
        </p>
      )}

      {/* Job list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-muted)' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: 'var(--pill-bg)', border: '1px solid var(--border)',
            display: 'grid', placeItems: 'center', margin: '0 auto 16px',
          }}>
            <Wrench size={22} style={{ color: 'var(--text-faint)' }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
            {search ? 'No matching jobs' : filter !== 'all' ? `No ${filter} jobs` : 'No jobs yet'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            {search ? 'Try a different search term in the top bar' : 'Create a new job to get started'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(job => (
            <JobCard
              key={job.id}
              job={job}
              invoice={invoices[job.id]}
              onClick={() => navigate(`/receptionist/jobs/${job.id}`)}
            />
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
