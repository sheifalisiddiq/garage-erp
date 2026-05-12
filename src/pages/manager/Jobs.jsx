import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatAED, formatDateTime, formatElapsed, statusColor } from '../../lib/utils'
import { Activity, Loader2, Car, User, Wrench } from 'lucide-react'

export default function ManagerJobs() {
  const [jobs, setJobs] = useState([])
  const [invoices, setInvoices] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: jobData } = await supabase
        .from('jobs')
        .select(`*, customers(name,phone), vehicles(make,model,license_plate), mechanics(name)`)
        .order('created_at', { ascending: false })

      if (jobData?.length) {
        const { data: invData } = await supabase.from('invoices').select('*').in('job_id', jobData.map(j => j.id))
        const m = {}; invData?.forEach(i => { m[i.job_id] = i }); setInvoices(m)
      }
      setJobs(jobData || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading jobs...
    </div>
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">All Jobs</h1>
        <p className="text-slate-400 text-sm mt-0.5">{jobs.length} total jobs</p>
      </div>

      <div className="space-y-3">
        {jobs.map(job => {
          const inv = invoices[job.id]
          return (
            <div key={job.id} className="bg-surface-700 border border-white/[0.06] rounded-2xl px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-bold text-brand-400 bg-brand-600/10 px-2 py-0.5 rounded-lg">{job.job_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-lg border ${statusColor(job.status)}`}>
                      {job.status === 'open' ? 'In Progress' : 'Complete'}
                    </span>
                    {inv && (
                      <span className={`text-xs px-2 py-0.5 rounded-lg border ${statusColor(inv.status)}`}>
                        {inv.status === 'paid' ? 'Paid' : 'Pending Payment'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-500" />{job.customers?.name}</span>
                    <span className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-slate-500" />{job.vehicles?.make} {job.vehicles?.model}</span>
                    <span className="flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5 text-slate-500" />{job.mechanics?.name}</span>
                  </div>
                  <p className="text-xs text-slate-500">{job.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {inv && <p className="text-base font-bold text-gold-400">{formatAED(inv.total_amount)}</p>}
                  {job.elapsed_time_seconds != null && (
                    <p className="text-xs text-slate-500">{formatElapsed(job.elapsed_time_seconds)}</p>
                  )}
                  <p className="text-xs text-slate-500">{formatDateTime(job.created_at)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
