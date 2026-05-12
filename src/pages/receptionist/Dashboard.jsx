import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatAED, formatElapsed, elapsedSeconds, formatTime, statusColor } from '../../lib/utils'
import {
  PlusCircle, Search, Clock, CheckCircle2, AlertCircle,
  Car, User, Wrench, RefreshCw, ChevronRight
} from 'lucide-react'

function LiveTimer({ createdAt }) {
  const [secs, setSecs] = useState(elapsedSeconds(createdAt))
  useEffect(() => {
    const t = setInterval(() => setSecs(elapsedSeconds(createdAt)), 1000)
    return () => clearInterval(t)
  }, [createdAt])
  return <span className="font-mono text-blue-400">{formatElapsed(secs)}</span>
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-surface-700 border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function JobCard({ job, invoice, onClick }) {
  const isOpen = job.status === 'open'
  const isPaid = invoice?.status === 'paid'
  const isPending = invoice?.status === 'sent'

  return (
    <div
      onClick={onClick}
      className="bg-surface-700 border border-white/[0.06] hover:border-brand-600/30 rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:bg-surface-600 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-bold text-brand-400 bg-brand-600/10 px-2 py-0.5 rounded-lg">
              {job.job_number}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${statusColor(job.status)}`}>
              {isOpen ? 'In Progress' : 'Complete'}
            </span>
            {invoice && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${statusColor(invoice.status)}`}>
                {isPaid ? 'Paid' : 'Pending Payment'}
              </span>
            )}
          </div>

          {/* Customer & vehicle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-1 text-sm text-slate-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              {job.customers?.name}
            </span>
            <span className="flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-slate-500" />
              {job.vehicles?.make} {job.vehicles?.model}
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 text-xs">{job.vehicles?.license_plate}</span>
            </span>
          </div>

          {/* Mechanic & description */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Wrench className="w-3 h-3" />
              {job.mechanics?.name}
            </span>
            <span className="truncate text-slate-500">{job.description}</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {isOpen ? (
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <LiveTimer createdAt={job.created_at} />
            </div>
          ) : invoice ? (
            <span className="text-sm font-semibold text-white">{formatAED(invoice.total_amount)}</span>
          ) : null}

          <span className="text-xs text-slate-500">{formatTime(job.created_at)}</span>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition mt-1" />
        </div>
      </div>
    </div>
  )
}

export default function ReceptionistDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [invoices, setInvoices] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const fetchJobs = useCallback(async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        customers(name, phone, email),
        vehicles(make, model, license_plate, year),
        mechanics(name)
      `)
      .order('created_at', { ascending: false })

    if (error) { console.error(error); return }
    setJobs(data || [])

    if (data?.length) {
      const jobIds = data.map(j => j.id)
      const { data: invData } = await supabase
        .from('invoices')
        .select('*')
        .in('job_id', jobIds)
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

  const todayJobs = jobs.filter(j => {
    const d = new Date(j.created_at)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })

  const openJobs = todayJobs.filter(j => j.status === 'open')
  const completedToday = todayJobs.filter(j => j.status === 'complete')
  const todayRevenue = completedToday.reduce((sum, j) => {
    const inv = invoices[j.id]
    return sum + (inv?.status === 'paid' ? Number(inv.total_amount) : 0)
  }, 0)
  const pendingPayment = Object.values(invoices).filter(i => i.status === 'sent').length

  const filtered = jobs.filter(j => {
    const matchSearch = !search ||
      j.job_number?.toLowerCase().includes(search.toLowerCase()) ||
      j.customers?.name?.toLowerCase().includes(search.toLowerCase()) ||
      j.vehicles?.license_plate?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'open' && j.status === 'open') ||
      (filter === 'complete' && j.status === 'complete') ||
      (filter === 'paid' && invoices[j.id]?.status === 'paid') ||
      (filter === 'pending' && invoices[j.id]?.status === 'sent')
    return matchSearch && matchFilter
  })

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={() => navigate('/receptionist/new-job')}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-3 sm:px-4 py-2.5 rounded-xl transition shadow-lg shadow-brand-600/20 flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">New Job</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Jobs" value={openJobs.length} icon={Clock} color="bg-blue-500/10 text-blue-400" />
        <StatCard label="Done Today" value={completedToday.length} icon={CheckCircle2} color="bg-emerald-500/10 text-emerald-400" />
        <StatCard label="Today's Revenue" value={formatAED(todayRevenue)} icon={() => <span className="text-gold-400 font-bold text-xs">AED</span>} color="bg-gold-500/10 text-gold-400" />
        <StatCard label="Pending Payment" value={pendingPayment} icon={AlertCircle} color="bg-amber-500/10 text-amber-400" />
      </div>

      {/* Search + filter */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search job #, customer, plate..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface-700 border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={fetchJobs}
            className="p-2.5 bg-surface-700 border border-white/[0.06] rounded-xl text-slate-400 hover:text-white transition flex-shrink-0"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['all', 'open', 'complete', 'paid', 'pending'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition flex-shrink-0 ${
                filter === f
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-700 text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Job list */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading jobs...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No jobs found</p>
          <p className="text-sm mt-1">
            {search ? 'Try a different search' : 'Create a new job to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
    </div>
  )
}
