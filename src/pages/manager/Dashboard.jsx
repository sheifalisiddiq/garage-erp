import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatAED, formatElapsed, formatTime, formatDateTime, statusColor, isToday } from '../../lib/utils'
import {
  BarChart3, Clock, CheckCircle2, AlertCircle, TrendingUp,
  Wrench, Package, Users, Activity, RefreshCw, Zap
} from 'lucide-react'

function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className={`bg-surface-700 border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 ${accent}`} />
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.05]`}>
          <Icon className={`w-4 h-4 ${accent.replace('bg-', 'text-').replace('/20','')}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

function LiveDot() {
  return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
      Live
    </span>
  )
}

export default function ManagerDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = useCallback(async () => {
    // Fetch all jobs with relations
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

    const todayJobs = jobs?.filter(j => isToday(j.created_at)) || []
    const openJobs = jobs?.filter(j => j.status === 'open') || []
    const completedToday = todayJobs.filter(j => j.status === 'complete')
    const paidToday = completedToday.filter(j => invMap[j.id]?.status === 'paid')
    const pendingPayment = invoices?.filter(i => i.status === 'sent') || []

    const revenueToday = paidToday.reduce((s, j) => s + Number(invMap[j.id]?.total_amount || 0), 0)
    const revenuePending = pendingPayment.reduce((s, i) => s + Number(i.total_amount || 0), 0)

    // Services breakdown (today)
    const svcBreakdown = {}
    completedToday.forEach(j => {
      j.job_services?.forEach(s => {
        svcBreakdown[s.service_name] = (svcBreakdown[s.service_name] || 0) + 1
      })
    })

    // Parts used today
    const partsUsed = {}
    completedToday.forEach(j => {
      j.job_parts?.forEach(p => {
        if (!partsUsed[p.part_name]) partsUsed[p.part_name] = { qty: 0, total: 0 }
        partsUsed[p.part_name].qty += p.quantity
        partsUsed[p.part_name].total += Number(p.part_cost) * p.quantity
      })
    })

    // Mechanic performance (today)
    const mechPerf = {}
    mechanics?.forEach(m => {
      mechPerf[m.id] = { name: m.name, jobs: 0, revenue: 0 }
    })
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
    <div className="flex items-center justify-center h-96 text-slate-500">
      <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading dashboard...
    </div>
  )

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Manager Dashboard</h1>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <p className="text-slate-400 text-sm">Welcome, {user?.name}</p>
            <LiveDot />
            {lastUpdated && (
              <span className="text-xs text-slate-600 hidden sm:inline">
                Updated {lastUpdated.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 bg-surface-700 border border-white/[0.06] rounded-xl text-slate-400 hover:text-white transition flex-shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Jobs Done Today"
          value={data.completedToday.length}
          sub={`${data.todayJobs.length} total today`}
          icon={CheckCircle2}
          accent="bg-emerald-500"
        />
        <StatCard
          label="Revenue Today"
          value={formatAED(data.revenueToday)}
          sub="From paid invoices"
          icon={TrendingUp}
          accent="bg-gold-500"
        />
        <StatCard
          label="Active Jobs"
          value={data.openJobs.length}
          sub="In progress now"
          icon={Clock}
          accent="bg-blue-500"
        />
        <StatCard
          label="Pending Payment"
          value={data.pendingPayment.length}
          sub={data.pendingPayment.length > 0 ? formatAED(data.revenuePending) + ' outstanding' : 'All clear'}
          icon={AlertCircle}
          accent="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: job timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Today's job timeline */}
          <div className="bg-surface-700 border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Job Timeline</h3>
              </div>
              <span className="text-xs text-slate-500">Today</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {data.todayJobs.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-500 text-sm">No jobs today yet</div>
              ) : (
                data.todayJobs.map(job => {
                  const inv = data.invoices[job.id]
                  const isOpen = job.status === 'open'
                  return (
                    <div key={job.id} className="px-5 py-3.5 hover:bg-surface-600 transition">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-bold text-brand-400">{job.job_number}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-lg border ${statusColor(job.status)}`}>
                              {isOpen ? 'In Progress' : 'Complete'}
                            </span>
                            {inv && (
                              <span className={`text-xs px-2 py-0.5 rounded-lg border ${statusColor(inv.status)}`}>
                                {inv.status === 'paid' ? 'Paid' : 'Pending'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span>{job.customers?.name}</span>
                            <span>·</span>
                            <span>{job.vehicles?.make} {job.vehicles?.model}</span>
                            <span>·</span>
                            <span>{job.mechanics?.name}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {inv ? (
                            <p className="text-sm font-bold text-gold-400">{formatAED(inv.total_amount)}</p>
                          ) : (
                            <p className="text-xs text-slate-500">{formatTime(job.created_at)}</p>
                          )}
                          {job.elapsed_time_seconds != null && (
                            <p className="text-xs text-slate-500">{formatElapsed(job.elapsed_time_seconds)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Open jobs (active) */}
          {data.openJobs.length > 0 && (
            <div className="bg-surface-700 border border-blue-500/20 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] bg-blue-500/5">
                <Zap className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider">Active Now</h3>
                <span className="ml-auto text-xs text-blue-400 font-medium">{data.openJobs.length} job{data.openJobs.length > 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {data.openJobs.map(job => (
                  <div key={job.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand-400">{job.job_number}</span>
                          <span className="text-xs text-slate-300">{job.customers?.name}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{job.vehicles?.make} {job.vehicles?.model} · {job.mechanics?.name}</p>
                      </div>
                      <div className="text-right">
                        <LiveElapsedCell createdAt={job.created_at} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Services breakdown */}
          <div className="bg-surface-700 border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06]">
              <Wrench className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Services Today</h3>
            </div>
            <div className="p-4 space-y-2">
              {Object.keys(data.svcBreakdown).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3">No services logged today</p>
              ) : (
                Object.entries(data.svcBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 truncate flex-1 mr-2">{name}</span>
                      <span className="text-brand-400 font-semibold flex-shrink-0">{count}×</span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Parts used */}
          <div className="bg-surface-700 border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06]">
              <Package className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Parts Used Today</h3>
            </div>
            <div className="p-4 space-y-2">
              {Object.keys(data.partsUsed).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3">No parts logged today</p>
              ) : (
                Object.entries(data.partsUsed)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([name, info]) => (
                    <div key={name} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 truncate flex-1 mr-2 text-xs">{name}</span>
                        <span className="text-gold-400 font-semibold text-xs flex-shrink-0">{formatAED(info.total)}</span>
                      </div>
                      <p className="text-xs text-slate-500">{info.qty} unit{info.qty > 1 ? 's' : ''}</p>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Mechanic performance */}
          <div className="bg-surface-700 border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06]">
              <Users className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Mechanics</h3>
            </div>
            <div className="p-4 space-y-3">
              {data.mechPerf
                .sort((a, b) => b.jobs - a.jobs || b.revenue - a.revenue)
                .map(m => (
                  <div key={m.name} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-brand-600/20 flex items-center justify-center text-brand-400 text-xs font-bold flex-shrink-0">
                      {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{m.name}</p>
                      <p className="text-xs text-slate-500">
                        {m.jobs} job{m.jobs !== 1 ? 's' : ''} · {formatAED(m.revenue)}
                        {m.activeJob && <span className="text-blue-400"> · {m.activeJob} active</span>}
                      </p>
                    </div>
                    {m.activeJob && (
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
                    )}
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LiveElapsedCell({ createdAt }) {
  const [secs, setSecs] = useState(() =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  )
  useEffect(() => {
    const t = setInterval(() => setSecs(Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)), 1000)
    return () => clearInterval(t)
  }, [createdAt])
  return <span className="font-mono text-blue-400 text-sm">{formatElapsed(secs)}</span>
}
