import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatAED, formatElapsed, formatTime, statusColor, isToday } from '../../lib/utils'
import {
  Clock, CheckCircle2, AlertCircle, TrendingUp,
  Wrench, Package, Users, Activity, RefreshCw, Zap
} from 'lucide-react'

/* ── Helpers ──────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/* ── Live elapsed timer ───────────────────────────────── */
function LiveElapsedCell({ createdAt }) {
  const [secs, setSecs] = useState(() =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  )
  useEffect(() => {
    const t = setInterval(() =>
      setSecs(Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)), 1000)
    return () => clearInterval(t)
  }, [createdAt])
  return (
    <span className="font-mono text-[13px] font-semibold text-blue-400 tabular-nums">
      {formatElapsed(secs)}
    </span>
  )
}

/* ── Stat card ────────────────────────────────────────── */
const STAT_COLORS = {
  emerald: {
    icon: 'bg-emerald-500/10 text-emerald-400',
    glow: 'group-hover:shadow-glow-emerald',
    blob: 'from-emerald-500/10',
  },
  gold: {
    icon: 'bg-amber-500/10 text-amber-400',
    glow: 'group-hover:shadow-glow-gold',
    blob: 'from-amber-500/10',
  },
  blue: {
    icon: 'bg-blue-500/10 text-blue-400',
    glow: 'group-hover:shadow-glow-blue',
    blob: 'from-blue-500/10',
  },
  amber: {
    icon: 'bg-orange-500/10 text-orange-400',
    glow: 'group-hover:shadow-glow-amber',
    blob: 'from-orange-500/10',
  },
}

function StatCard({ label, value, sub, icon: Icon, color = 'blue', index = 0 }) {
  const c = STAT_COLORS[color]
  return (
    <div
      className={`group panel relative overflow-hidden cursor-default
        transition-all duration-300 hover:-translate-y-0.5 ${c.glow}
        animate-fade-up`}
      style={{ animationDelay: `${index * 65}ms` }}
    >
      {/* Ambient glow blob */}
      <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-radial ${c.blob} to-transparent blur-2xl pointer-events-none opacity-80`} />

      <div className="relative p-5">
        <div className="flex items-start justify-between mb-4">
          <p className="text-[10.5px] font-semibold text-slate-600 uppercase tracking-[0.08em] leading-none">{label}</p>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon} transition-transform duration-200 group-hover:scale-110`}>
            <Icon className="w-4 h-4" strokeWidth={2} />
          </div>
        </div>
        <p className="text-[2rem] font-bold text-white leading-none tracking-tighter tabular-nums">{value}</p>
        {sub && <p className="text-[11.5px] text-slate-600 mt-2 leading-snug">{sub}</p>}
      </div>
    </div>
  )
}

/* ── Panel wrappers ───────────────────────────────────── */
function Panel({ children, className = '', style }) {
  return (
    <div className={`panel overflow-hidden ${className}`} style={style}>
      {children}
    </div>
  )
}

function PanelHeader({ icon: Icon, iconClass = 'text-slate-600', title, meta, children }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/[0.05]">
      {Icon && <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${iconClass}`} strokeWidth={2} />}
      <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-[0.08em]">{title}</span>
      {meta && <span className="text-[11px] text-slate-700 ml-auto">{meta}</span>}
      {children}
    </div>
  )
}

/* ── Empty state ──────────────────────────────────────── */
function Empty({ children }) {
  return (
    <div className="flex items-center justify-center py-10 px-5">
      <p className="text-[12px] text-slate-700 text-center">{children}</p>
    </div>
  )
}

/* ── Main dashboard ───────────────────────────────────── */
export default function ManagerDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = useCallback(async () => {
    const { data: jobs } = await supabase
      .from('jobs')
      .select(`
        *,
        customers(name, phone),
        vehicles(make, model, license_plate),
        mechanics(name),
        job_services(*),
        job_parts(*)
      `)
      .order('created_at', { ascending: false })

    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: mechanics } = await supabase
      .from('mechanics')
      .select('*')
      .eq('status', 'active')

    const invMap = {}
    invoices?.forEach(i => { invMap[i.job_id] = i })

    const todayJobs     = jobs?.filter(j => isToday(j.created_at)) || []
    const openJobs      = jobs?.filter(j => j.status === 'open') || []
    const completedToday = todayJobs.filter(j => j.status === 'complete')
    const paidToday     = completedToday.filter(j => invMap[j.id]?.status === 'paid')
    const pendingPayment = invoices?.filter(i => i.status === 'sent') || []

    const revenueToday  = paidToday.reduce((s, j) => s + Number(invMap[j.id]?.total_amount || 0), 0)
    const revenuePending = pendingPayment.reduce((s, i) => s + Number(i.total_amount || 0), 0)

    const svcBreakdown = {}
    completedToday.forEach(j => {
      j.job_services?.forEach(s => {
        svcBreakdown[s.service_name] = (svcBreakdown[s.service_name] || 0) + 1
      })
    })

    const partsUsed = {}
    completedToday.forEach(j => {
      j.job_parts?.forEach(p => {
        if (!partsUsed[p.part_name]) partsUsed[p.part_name] = { qty: 0, total: 0 }
        partsUsed[p.part_name].qty   += p.quantity
        partsUsed[p.part_name].total += Number(p.part_cost) * p.quantity
      })
    })

    const mechPerf = {}
    mechanics?.forEach(m => { mechPerf[m.id] = { name: m.name, jobs: 0, revenue: 0 } })
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

    setData({
      jobs: jobs || [],
      invoices: invMap,
      todayJobs,
      openJobs,
      completedToday,
      paidToday,
      pendingPayment,
      revenueToday,
      revenuePending,
      svcBreakdown,
      partsUsed,
      mechPerf: Object.values(mechPerf),
    })
    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('manager-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_services' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_parts' }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchData])

  if (loading || !data) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex items-center gap-2.5 text-slate-600">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-[13px]">Loading dashboard…</span>
      </div>
    </div>
  )

  const topSvcCount = Math.max(...Object.values(data.svcBreakdown), 1)

  return (
    <div className="p-5 sm:p-7 max-w-[1100px] mx-auto">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8 gap-4 animate-fade-up">
        <div>
          <p className="text-[10.5px] font-semibold text-slate-700 uppercase tracking-[0.09em] mb-1.5">
            {new Date().toLocaleDateString('en-AE', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-[22px] font-bold text-white leading-none tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-[13px] text-slate-600 mt-1.5">
            Here's what's happening at the garage today.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          {/* Live badge */}
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-2.5 py-1.5 rounded-lg">
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-400" />
            </span>
            Live
          </div>

          {/* Last updated */}
          {lastUpdated && (
            <span className="hidden sm:block text-[11px] text-slate-700 tabular-nums">
              {lastUpdated.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}

          {/* Refresh */}
          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-surface-700 border border-white/[0.06] text-slate-600 hover:text-white hover:bg-surface-600 transition-all duration-150"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Jobs Done Today"
          value={data.completedToday.length}
          sub={`${data.todayJobs.length} total today`}
          icon={CheckCircle2}
          color="emerald"
          index={0}
        />
        <StatCard
          label="Revenue Today"
          value={formatAED(data.revenueToday)}
          sub="From paid invoices"
          icon={TrendingUp}
          color="gold"
          index={1}
        />
        <StatCard
          label="Active Jobs"
          value={data.openJobs.length}
          sub="In progress now"
          icon={Clock}
          color="blue"
          index={2}
        />
        <StatCard
          label="Pending Payment"
          value={data.pendingPayment.length}
          sub={data.pendingPayment.length > 0
            ? `${formatAED(data.revenuePending)} outstanding`
            : 'All clear'}
          icon={AlertCircle}
          color="amber"
          index={3}
        />
      </div>

      {/* ── Content grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left column — timelines */}
        <div className="lg:col-span-2 space-y-4">

          {/* Active now */}
          {data.openJobs.length > 0 && (
            <Panel className="animate-fade-up stagger-5">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-blue-500/15 bg-blue-500/[0.04]">
                <span className="relative flex w-2 h-2 flex-shrink-0">
                  <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-50" />
                  <span className="relative inline-flex rounded-full w-2 h-2 bg-blue-400" />
                </span>
                <span className="text-[10.5px] font-semibold text-blue-400 uppercase tracking-[0.08em]">
                  Active Now
                </span>
                <span className="ml-auto text-[11px] font-semibold text-blue-500/70">
                  {data.openJobs.length} job{data.openJobs.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {data.openJobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors duration-100">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10.5px] font-bold text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-md">
                          {job.job_number}
                        </span>
                        <span className="text-[12.5px] font-medium text-slate-200">{job.customers?.name}</span>
                      </div>
                      <p className="text-[11.5px] text-slate-600">
                        {job.vehicles?.make} {job.vehicles?.model}
                        <span className="text-slate-700 mx-1.5">·</span>
                        {job.mechanics?.name}
                      </p>
                    </div>
                    <LiveElapsedCell createdAt={job.created_at} />
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Job timeline */}
          <Panel className="animate-fade-up stagger-6">
            <PanelHeader icon={Activity} title="Job Timeline" meta="Today" />

            {data.todayJobs.length === 0 ? (
              <Empty>No jobs today yet</Empty>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {data.todayJobs.map(job => {
                  const inv = data.invoices[job.id]
                  const isOpen = job.status === 'open'
                  return (
                    <div key={job.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors duration-100">

                      {/* Status dot */}
                      <div className="flex-shrink-0 mt-0.5">
                        <span className={`block w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-blue-400 animate-pulse-soft' : 'bg-emerald-500'}`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="font-mono text-[10.5px] font-bold text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-md">
                            {job.job_number}
                          </span>
                          <span className={`text-[10.5px] px-2 py-0.5 rounded-lg border font-medium ${statusColor(job.status)}`}>
                            {isOpen ? 'In Progress' : 'Complete'}
                          </span>
                          {inv && (
                            <span className={`text-[10.5px] px-2 py-0.5 rounded-lg border font-medium ${statusColor(inv.status)}`}>
                              {inv.status === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11.5px] text-slate-600 flex-wrap">
                          <span className="text-slate-400 font-medium">{job.customers?.name}</span>
                          <span className="text-slate-700 mx-0.5">·</span>
                          <span>{job.vehicles?.make} {job.vehicles?.model}</span>
                          <span className="text-slate-700 mx-0.5">·</span>
                          <span>{job.mechanics?.name}</span>
                        </div>
                      </div>

                      {/* Value */}
                      <div className="text-right flex-shrink-0">
                        {inv ? (
                          <p className="text-[13px] font-bold text-amber-400 tabular-nums">{formatAED(inv.total_amount)}</p>
                        ) : (
                          <p className="font-mono text-[11px] text-slate-700">{formatTime(job.created_at)}</p>
                        )}
                        {job.elapsed_time_seconds != null && !isOpen && (
                          <p className="text-[11px] text-slate-700 tabular-nums">{formatElapsed(job.elapsed_time_seconds)}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Services today */}
          <Panel className="animate-fade-up stagger-5">
            <PanelHeader icon={Wrench} title="Services Today" />
            <div className="p-5 space-y-3">
              {Object.keys(data.svcBreakdown).length === 0 ? (
                <Empty>No services logged today</Empty>
              ) : (
                Object.entries(data.svcBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, count]) => (
                    <div key={name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[12.5px] text-slate-300 truncate flex-1 mr-3">{name}</span>
                        <span className="text-[12px] font-bold text-brand-400 tabular-nums flex-shrink-0">{count}×</span>
                      </div>
                      <div className="h-[3px] bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-700"
                          style={{ width: `${(count / topSvcCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
              )}
            </div>
          </Panel>

          {/* Parts used */}
          <Panel className="animate-fade-up stagger-5" style={{ animationDelay: '70ms' }}>
            <PanelHeader icon={Package} title="Parts Used Today" />
            <div className="p-5 space-y-3">
              {Object.keys(data.partsUsed).length === 0 ? (
                <Empty>No parts logged today</Empty>
              ) : (
                Object.entries(data.partsUsed)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([name, info]) => (
                    <div key={name}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[12px] text-slate-300 truncate flex-1">{name}</span>
                        <span className="text-[12px] font-bold text-amber-400 tabular-nums flex-shrink-0">
                          {formatAED(info.total)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 mt-0.5">
                        {info.qty} unit{info.qty !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ))
              )}
            </div>
          </Panel>

          {/* Mechanics */}
          <Panel className="animate-fade-up stagger-5" style={{ animationDelay: '140ms' }}>
            <PanelHeader icon={Users} title="Mechanics" />
            <div className="p-5 space-y-3">
              {data.mechPerf
                .sort((a, b) => b.jobs - a.jobs || b.revenue - a.revenue)
                .map(m => {
                  const initials = m.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                  return (
                    <div key={m.name} className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`relative flex-shrink-0 ${m.activeJob ? 'ring-1 ring-blue-500/40 ring-offset-1 ring-offset-[#141c2e] rounded-full' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 text-[10.5px] font-bold">
                          {initials}
                        </div>
                        {m.activeJob && (
                          <span className="absolute -bottom-px -right-px w-2 h-2 rounded-full bg-blue-400 border border-[#141c2e]" />
                        )}
                      </div>

                      {/* Name + stats */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-white truncate leading-none">{m.name}</p>
                        <p className="text-[11px] text-slate-600 mt-[3px]">
                          {m.jobs} job{m.jobs !== 1 ? 's' : ''}
                          <span className="text-slate-700 mx-1">·</span>
                          <span className="text-amber-500/80">{formatAED(m.revenue)}</span>
                          {m.activeJob && (
                            <span className="text-blue-400/80"> · {m.activeJob}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )
                })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
