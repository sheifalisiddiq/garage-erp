import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatAED, formatDate, quoteStatusColor } from '../../lib/utils'
import { ClipboardList, PlusCircle, Search, ChevronRight, Loader2 } from 'lucide-react'

const STATUS_FILTERS = ['all', 'draft', 'sent', 'accepted', 'expired']

export default function QuoteList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isReceptionist = user?.role === 'receptionist'

  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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
      .select('*')
      .order('created_at', { ascending: false })

    setQuotes(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchQuotes()
  }, [fetchQuotes])

  const basePath = isReceptionist ? '/receptionist/quotes' : '/manager/quotes'

  const filtered = quotes.filter(q => {
    const matchStatus = statusFilter === 'all' || q.status === statusFilter
    const matchSearch =
      q.quote_number.toLowerCase().includes(search.toLowerCase()) ||
      q.customer_name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const isExpired = (validUntil) => new Date(validUntil) < new Date()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Quotations</h1>
          <p className="text-sm text-slate-500 mt-0.5">{quotes.length} total quotes</p>
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
          placeholder="Search by quote number or customer..."
          className="w-full bg-surface-700 border border-white/[0.06] text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-500 transition"
        />
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition border ${
              statusFilter === s
                ? 'bg-brand-600/20 border-brand-500/40 text-brand-400'
                : 'bg-surface-700 border-white/[0.06] text-slate-500 hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
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
            const expired = isExpired(q.valid_until)
            return (
              <button
                key={q.id}
                onClick={() => navigate(`${basePath}/${q.id}`)}
                className="w-full text-left bg-surface-700 border border-white/[0.06] rounded-2xl p-4 hover:border-brand-500/20 hover:bg-surface-600 transition-all duration-150 animate-fade-up group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="flex-shrink-0 text-xs font-bold text-brand-400 bg-brand-400/10 border border-brand-400/20 px-2 py-0.5 rounded-lg font-mono">
                      {q.quote_number}
                    </span>
                    <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${quoteStatusColor(q.status)}`}>
                      {q.status}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors flex-shrink-0 mt-0.5" />
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Customer</p>
                    <p className="text-sm font-medium text-slate-200 truncate">{q.customer_name}</p>
                    <p className="text-xs text-slate-500">{q.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Vehicle</p>
                    <p className="text-xs text-slate-300 truncate">{q.vehicle_info}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Valid Until</p>
                    <p className={`text-xs font-medium ${expired ? 'text-red-400' : 'text-slate-300'}`}>
                      {formatDate(q.valid_until)}
                      {expired && ' · Expired'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total</p>
                    <p className="text-base font-bold text-amber-400">{formatAED(q.total_amount)}</p>
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
