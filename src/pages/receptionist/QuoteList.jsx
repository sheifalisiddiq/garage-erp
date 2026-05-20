import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatAED, formatDate, formatDateTime, quoteStatusColor } from '../../lib/utils'
import {
  ClipboardList, PlusCircle, Search, ChevronRight,
  Loader2, Car, User, Calendar, FileText, Wrench
} from 'lucide-react'

const STATUS_FILTERS = ['all', 'draft', 'sent', 'accepted', 'expired']

export default function QuoteList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isReceptionist = user?.role === 'receptionist'

  const [quotes, setQuotes]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState('all')

  const fetchQuotes = useCallback(async () => {
    // Auto-expire stale quotes
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('quotations')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .lt('valid_until', today)
      .in('status', ['draft', 'sent'])

    const { data } = await supabase
      .from('quotations')
      .select('*, quotation_items(id, item_type)')
      .order('created_at', { ascending: false })

    setQuotes(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchQuotes() }, [fetchQuotes])

  const basePath = isReceptionist ? '/receptionist/quotes' : '/manager/quotes'

  const filtered = quotes.filter(q => {
    const matchStatus = statusFilter === 'all' || q.status === statusFilter
    const matchSearch =
      q.quote_number.toLowerCase().includes(search.toLowerCase()) ||
      q.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (q.vehicle_info || '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  // Summary counts for header
  const counts = STATUS_FILTERS.slice(1).reduce((acc, s) => {
    acc[s] = quotes.filter(q => q.status === s).length
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Quotations</h1>
          <p className="text-sm text-slate-500 mt-0.5">{quotes.length} total · {counts.accepted || 0} accepted · {counts.sent || 0} pending</p>
        </div>
        {isReceptionist && (
          <button
            onClick={() => navigate('/receptionist/quotes/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition"
          >
            <PlusCircle className="w-4 h-4" />
            New Quote
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by quote number, customer, or vehicle..."
          className="w-full bg-surface-700 border border-white/[0.06] text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-500 transition"
        />
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_FILTERS.map(s => {
          const count = s === 'all' ? quotes.length : counts[s] || 0
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition border ${
                statusFilter === s
                  ? 'bg-brand-600/20 border-brand-500/40 text-brand-400'
                  : 'bg-surface-700 border-white/[0.06] text-slate-500 hover:text-white'
              }`}
            >
              {s}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                statusFilter === s ? 'bg-brand-500/30 text-brand-300' : 'bg-white/[0.06] text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Quote cards */}
      {filtered.length === 0 ? (
        <div className="bg-surface-700 border border-white/[0.06] rounded-2xl py-16 text-center">
          <ClipboardList className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No quotes found</p>
          <p className="text-slate-600 text-sm mt-1">
            {isReceptionist ? 'Create your first quote to get started.' : 'No quotations have been created yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q, i) => {
            const isExpired    = new Date(q.valid_until) < new Date()
            const serviceCount = (q.quotation_items || []).filter(it => it.item_type === 'service').length
            const partCount    = (q.quotation_items || []).filter(it => it.item_type === 'part').length
            return (
              <button
                key={q.id}
                onClick={() => navigate(`${basePath}/${q.id}`)}
                className="w-full text-left bg-surface-700 border border-white/[0.06] rounded-2xl p-4 hover:border-brand-500/20 hover:bg-surface-600 transition-all duration-150 animate-fade-up group"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Top row: quote number + status + arrow */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-bold text-brand-400 bg-brand-400/10 border border-brand-400/20 px-2 py-0.5 rounded-lg font-mono">
                      {q.quote_number}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${quoteStatusColor(q.status)}`}>
                      {q.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-600 hidden sm:block">{formatDateTime(q.created_at)}</span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors" />
                  </div>
                </div>

                {/* Customer + Vehicle row */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{q.customer_name}</p>
                      <p className="text-xs text-slate-500">{q.customer_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 min-w-0">
                    <Car className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300 truncate leading-relaxed">{q.vehicle_info || '—'}</p>
                  </div>
                </div>

                {/* Items summary row */}
                <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="w-3 h-3" />
                    <span>{serviceCount} service{serviceCount !== 1 ? 's' : ''}</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    <span>{partCount} part{partCount !== 1 ? 's' : ''}</span>
                  </div>
                  {q.created_by && (
                    <>
                      <span>·</span>
                      <span>by {q.created_by}</span>
                    </>
                  )}
                </div>

                {/* Notes preview */}
                {q.notes && (
                  <div className="mb-3 px-3 py-2 bg-surface-600 rounded-lg text-xs text-slate-400 truncate">
                    {q.notes}
                  </div>
                )}

                {/* Bottom row: validity + financials */}
                <div className="flex items-end justify-between pt-2.5 border-t border-white/[0.04]">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span className={isExpired ? 'text-red-400 font-medium' : 'text-slate-400'}>
                      Valid until {formatDate(q.valid_until)}
                      {isExpired && ' · Expired'}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="flex items-baseline gap-3">
                      <span className="text-xs text-slate-500">
                        {formatAED(q.subtotal)} + VAT
                      </span>
                      <span className="text-base font-bold text-amber-400">{formatAED(q.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
