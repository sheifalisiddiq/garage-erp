import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatAED, formatDate, formatDateTime, quoteStatusColor } from '../../lib/utils'
import {
  ArrowLeft, Printer, CheckCircle2, Send, Clock,
  XCircle, Wrench, Loader2, User, Car, FileText
} from 'lucide-react'

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-surface-700 border border-white/[0.06] rounded-2xl overflow-hidden print:border-0 print:bg-white print:rounded-none">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] print:hidden">
        <Icon className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-5 print:p-0">{children}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${quoteStatusColor(status)}`}>
      {status}
    </span>
  )
}

export default function QuoteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isReceptionist = user?.role === 'receptionist'

  const [quote, setQuote] = useState(null)
  const [lineItems, setLineItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchQuote = useCallback(async () => {
    const [{ data: q }, { data: items }] = await Promise.all([
      supabase.from('quotations').select('*').eq('id', id).single(),
      supabase.from('quotation_items').select('*').eq('quotation_id', id).order('item_type'),
    ])
    setQuote(q)
    setLineItems(items || [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchQuote()
  }, [fetchQuote])

  const updateStatus = async (newStatus) => {
    setUpdating(true)
    await supabase.from('quotations')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
    await fetchQuote()
    setUpdating(false)
  }

  const convertToJob = () => {
    sessionStorage.setItem('prefill_job', JSON.stringify({
      customerName:  quote.customer_name,
      customerPhone: quote.customer_phone,
      vehicleInfo:   quote.vehicle_info,
    }))
    navigate('/receptionist/new-job')
  }

  const basePath = isReceptionist ? '/receptionist/quotes' : '/manager/quotes'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="p-6 text-center text-slate-400">Quote not found.</div>
    )
  }

  const isExpired = new Date(quote.valid_until) < new Date()
  const services = lineItems.filter(i => i.item_type === 'service')
  const parts = lineItems.filter(i => i.item_type === 'part')

  return (
    <>
      {/* ── Screen layout ── */}
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5 animate-fade-up print:hidden">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(basePath)}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.06] transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-white font-mono">{quote.quote_number}</h1>
              <StatusBadge status={quote.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Created {formatDateTime(quote.created_at)} by {quote.created_by}</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-600 border border-white/[0.06] text-slate-300 hover:text-white text-sm font-medium transition"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>

        {/* Quote Info */}
        <Section title="Quote Details" icon={FileText}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Customer</p>
              <p className="text-slate-200 font-medium">{quote.customer_name}</p>
              <p className="text-slate-400">{quote.customer_phone}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Vehicle</p>
              <p className="text-slate-300">{quote.vehicle_info}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Valid Until</p>
              <p className={`font-medium ${isExpired ? 'text-red-400' : 'text-slate-200'}`}>
                {formatDate(quote.valid_until)}
                {isExpired && <span className="ml-2 text-xs">(Expired)</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Validity</p>
              <p className="text-slate-300">{quote.valid_days} days</p>
            </div>
          </div>
          {quote.notes && (
            <div className="mt-4 p-3 bg-surface-600 rounded-xl text-sm text-slate-300">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Notes</p>
              {quote.notes}
            </div>
          )}
        </Section>

        {/* Line Items */}
        <div className="bg-surface-700 border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06]">
            <Wrench className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Line Items</h3>
          </div>
          <div className="p-5 space-y-1">
            {lineItems.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No items on this quote.</p>
            ) : (
              <>
                {lineItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0 text-sm">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0 ${
                        item.item_type === 'service'
                          ? 'text-blue-400 bg-blue-400/10'
                          : 'text-amber-400 bg-amber-400/10'
                      }`}>
                        {item.item_type === 'service' ? 'SVC' : 'PRT'}
                      </span>
                      <span className="text-slate-200 truncate">{item.item_name}</span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 ml-3">
                      <span className="text-slate-500 text-xs">×{item.quantity}</span>
                      <span className="text-slate-400 text-xs w-24 text-right">{formatAED(item.unit_cost)} ea</span>
                      <span className="text-white font-medium w-24 text-right">{formatAED(item.line_total)}</span>
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="pt-4 space-y-1.5 border-t border-white/[0.06] mt-2">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Subtotal</span>
                    <span>{formatAED(quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>VAT (5%)</span>
                    <span>{formatAED(quote.vat_amount)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/[0.06]">
                    <span>Total</span>
                    <span className="text-amber-400">{formatAED(quote.total_amount)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status Actions — receptionist only */}
        {isReceptionist && (
          <div className="bg-surface-700 border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">Actions</p>
            <div className="flex flex-wrap gap-2">
              {quote.status === 'draft' && (
                <button
                  onClick={() => updateStatus('sent')}
                  disabled={updating}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 text-sm font-semibold transition disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Mark as Sent
                </button>
              )}
              {quote.status === 'sent' && (
                <>
                  <button
                    onClick={() => updateStatus('accepted')}
                    disabled={updating}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-sm font-semibold transition disabled:opacity-50"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Mark as Accepted
                  </button>
                  <button
                    onClick={() => updateStatus('expired')}
                    disabled={updating}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm font-semibold transition disabled:opacity-50"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                    Mark as Expired
                  </button>
                </>
              )}
              {quote.status === 'accepted' && (
                <button
                  onClick={convertToJob}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition"
                >
                  <Wrench className="w-4 h-4" />
                  Convert to Job
                </button>
              )}
              {(quote.status === 'expired') && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <XCircle className="w-4 h-4" />
                  This quote has expired.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Print layout ── */}
      <div className="hidden print:block p-10 bg-white text-black font-sans">
        {/* Garage header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-200">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Garage ERP</h1>
            <p className="text-gray-500 text-sm mt-0.5">Dubai Auto Services</p>
            <p className="text-gray-500 text-sm">info@garageerp.ae · +971 4 123 4567</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-gray-900">{quote.quote_number}</div>
            <div className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gray-100 text-gray-600 mt-1 capitalize">
              {quote.status}
            </div>
          </div>
        </div>

        {/* Customer + Vehicle */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Bill To</p>
            <p className="font-bold text-gray-900">{quote.customer_name}</p>
            <p className="text-gray-600">{quote.customer_phone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Vehicle</p>
            <p className="text-gray-700">{quote.vehicle_info}</p>
            <p className="text-gray-400 text-sm mt-1">Valid until: {formatDate(quote.valid_until)}</p>
          </div>
        </div>

        {/* Line items table */}
        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 text-xs text-gray-400 uppercase tracking-wider font-semibold w-1/2">Description</th>
              <th className="text-center py-2 text-xs text-gray-400 uppercase tracking-wider font-semibold">Type</th>
              <th className="text-right py-2 text-xs text-gray-400 uppercase tracking-wider font-semibold">Qty</th>
              <th className="text-right py-2 text-xs text-gray-400 uppercase tracking-wider font-semibold">Unit Price</th>
              <th className="text-right py-2 text-xs text-gray-400 uppercase tracking-wider font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map(item => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-2.5 font-medium text-gray-800">{item.item_name}</td>
                <td className="py-2.5 text-center text-xs text-gray-500 capitalize">{item.item_type}</td>
                <td className="py-2.5 text-right text-gray-600">{item.quantity}</td>
                <td className="py-2.5 text-right text-gray-600">{formatAED(item.unit_cost)}</td>
                <td className="py-2.5 text-right font-semibold text-gray-900">{formatAED(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatAED(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>VAT (5%)</span>
              <span>{formatAED(quote.vat_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t-2 border-gray-200">
              <span>Total</span>
              <span>{formatAED(quote.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Notes</p>
            <p className="text-gray-700 text-sm">{quote.notes}</p>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
          This quote is valid for {quote.valid_days} days from the date of issue. Prices are inclusive of 5% VAT.
        </div>
      </div>
    </>
  )
}
