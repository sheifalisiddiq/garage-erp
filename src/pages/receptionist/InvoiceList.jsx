import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatAED, formatDateTime, statusColor } from '../../lib/utils'
import { Receipt, Loader2, ChevronRight } from 'lucide-react'

export default function InvoiceList() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('invoices')
      .select(`*, jobs(job_number, customers(name), vehicles(make, model))`)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setInvoices(data || []); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Invoices</h1>
        <p className="text-slate-400 text-sm mt-0.5">{invoices.length} total invoices</p>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No invoices yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <div
              key={inv.id}
              onClick={() => navigate(`/receptionist/jobs/${inv.job_id}`)}
              className="bg-surface-700 border border-white/[0.06] hover:border-brand-600/30 rounded-2xl px-5 py-4 cursor-pointer transition-all group flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-brand-400 bg-brand-600/10 px-2 py-0.5 rounded-lg">{inv.invoice_number}</span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs text-slate-400">{inv.jobs?.job_number}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border capitalize ${statusColor(inv.status)}`}>
                    {inv.status === 'sent' ? 'Pending Payment' : 'Paid'}
                  </span>
                </div>
                <p className="text-sm text-white font-medium">{inv.jobs?.customers?.name}</p>
                <p className="text-xs text-slate-400">{inv.jobs?.vehicles?.make} {inv.jobs?.vehicles?.model} · {formatDateTime(inv.created_at)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold text-gold-400">{formatAED(inv.total_amount)}</p>
                {inv.paid_at && <p className="text-xs text-slate-500 capitalize">{inv.payment_method}</p>}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
