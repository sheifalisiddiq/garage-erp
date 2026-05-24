import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatAED, formatDate, formatDateTime, quoteStatusColor } from '../../lib/utils'
import {
  ArrowLeft, Printer, CheckCircle2, Send, Clock,
  XCircle, Wrench, Loader2, FileText, FileDown, Mail
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

  const [quote, setQuote]         = useState(null)
  const [lineItems, setLineItems] = useState([])
  const [loading, setLoading]     = useState(true)
  const [updating, setUpdating]   = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  const tpl = (() => {
    try { return JSON.parse(localStorage.getItem('pitstop_template') || 'null') } catch { return null }
  })() || { companyName: 'Pitstop Garage', companyPhone: '+971 4 123 4567', companyEmail: 'info@pitstop.ae', defaultValidity: 14, footerText: 'Prices are inclusive of 5% VAT. This quote is valid for the stated validity period.' }

  const fetchQuote = useCallback(async () => {
    const [{ data: q }, { data: items }] = await Promise.all([
      supabase.from('quotations').select('*').eq('id', id).single(),
      supabase.from('quotation_items').select('*').eq('quotation_id', id).order('item_type'),
    ])
    setQuote(q)
    setLineItems(items || [])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchQuote() }, [fetchQuote])

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

  const handlePDF = async () => {
    const printEl = document.getElementById('pdf-print-area')
    if (!printEl) return
    setDownloading(true)

    // Reveal off-screen so html2canvas can render it
    const prev = {
      position: printEl.style.position,
      top:      printEl.style.top,
      left:     printEl.style.left,
      display:  printEl.style.display,
      width:    printEl.style.width,
    }
    printEl.style.position = 'fixed'
    printEl.style.top      = '0'
    printEl.style.left     = '-9999px'
    printEl.style.display  = 'block'
    printEl.style.width    = '794px' // ~A4 at 96dpi

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(printEl, {
        scale:           2,
        useCORS:         true,
        logging:         false,
        backgroundColor: '#ffffff',
      })

      const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW    = pdf.internal.pageSize.getWidth()
      const pageH    = pdf.internal.pageSize.getHeight()
      const imgH     = (canvas.height * pageW) / canvas.width
      const imgData  = canvas.toDataURL('image/png')

      let remaining = imgH
      let offset    = 0
      pdf.addImage(imgData, 'PNG', 0, offset, pageW, imgH)
      remaining -= pageH

      while (remaining > 0) {
        offset -= pageH
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, offset, pageW, imgH)
        remaining -= pageH
      }

      pdf.save(`${quote.quote_number}.pdf`)
    } finally {
      Object.assign(printEl.style, prev)
      setDownloading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!quote.customer_email) {
      alert('No email address on file for this customer. Please recreate the quote with an email address.')
      return
    }
    const printEl = document.getElementById('pdf-print-area')
    if (!printEl) return
    setSendingEmail(true)

    const prev = {
      position: printEl.style.position,
      top:      printEl.style.top,
      left:     printEl.style.left,
      display:  printEl.style.display,
      width:    printEl.style.width,
    }
    printEl.style.position = 'fixed'
    printEl.style.top      = '0'
    printEl.style.left     = '-9999px'
    printEl.style.display  = 'block'
    printEl.style.width    = '794px'

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(printEl, {
        scale:           2,
        useCORS:         true,
        logging:         false,
        backgroundColor: '#ffffff',
      })

      const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW   = pdf.internal.pageSize.getWidth()
      const pageH   = pdf.internal.pageSize.getHeight()
      const imgH    = (canvas.height * pageW) / canvas.width
      const imgData = canvas.toDataURL('image/png')

      let remaining = imgH
      let offset    = 0
      pdf.addImage(imgData, 'PNG', 0, offset, pageW, imgH)
      remaining -= pageH

      while (remaining > 0) {
        offset -= pageH
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, offset, pageW, imgH)
        remaining -= pageH
      }

      const pdfBase64 = pdf.output('datauristring').split(',')[1]

      const quoteHtml = printEl.innerHTML

      const { error } = await supabase.functions.invoke('send-quotation', {
        body: {
          to:           quote.customer_email,
          quoteHtml,
          quoteNumber:  quote.quote_number,
          totalAmount:  quote.total_amount,
          customerName: quote.customer_name,
          pdfBase64,
        },
      })

      if (error) throw new Error(error.message || 'Failed to send email')
      alert(`Quote emailed successfully to ${quote.customer_email}`)
    } catch (err) {
      alert('Error sending email: ' + err.message)
    } finally {
      Object.assign(printEl.style, prev)
      setSendingEmail(false)
    }
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
    return <div className="p-6 text-center text-slate-400">Quote not found.</div>
  }

  const isExpired  = new Date(quote.valid_until) < new Date()
  const services   = lineItems.filter(i => i.item_type === 'service')
  const parts      = lineItems.filter(i => i.item_type === 'part')

  return (
    <>
      {/* ── Screen layout ── */}
      <div className="max-w-3xl mx-auto flex flex-col gap-5 animate-fade-up print:hidden">
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

          {/* Export buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-600 border border-white/[0.06] text-slate-300 hover:text-white text-sm font-medium transition"
              title="Print"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handlePDF}
              disabled={downloading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-600 border border-white/[0.06] text-slate-300 hover:text-white text-sm font-medium transition disabled:opacity-60"
              title="Download PDF"
            >
              {downloading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <FileDown className="w-4 h-4" />
              }
              <span className="hidden sm:inline">{downloading ? 'Generating…' : 'Download PDF'}</span>
            </button>
            {isReceptionist && (
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !quote.customer_email}
                title={quote.customer_email ? `Send to ${quote.customer_email}` : 'No email on file'}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition disabled:opacity-40"
              >
                {sendingEmail
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Mail className="w-4 h-4" />
                }
                <span className="hidden sm:inline">{sendingEmail ? 'Sending…' : 'Send Email'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quote Details */}
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
            {quote.created_by && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Prepared By</p>
                <p className="text-slate-300">{quote.created_by}</p>
              </div>
            )}
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
            <span className="ml-auto text-xs text-slate-500">
              {services.length} service{services.length !== 1 ? 's' : ''} · {parts.length} part{parts.length !== 1 ? 's' : ''}
            </span>
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
                          ? 'text-rose-400 bg-rose-400/10'
                          : 'text-slate-400 bg-slate-400/10'
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
                    <span className="text-white">{formatAED(quote.total_amount)}</span>
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.10] text-slate-300 hover:bg-white/[0.10] text-sm font-semibold transition disabled:opacity-50"
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
              {quote.status === 'expired' && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <XCircle className="w-4 h-4" />
                  This quote has expired.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Print / PDF layout ── */}
      <div id="pdf-print-area" className="hidden print:block p-10 bg-white text-black font-sans">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-200">
          <div>
            <h1 className="text-2xl font-black text-gray-900">{tpl.companyName}</h1>
            <p className="text-gray-500 text-sm mt-0.5">Dubai Auto Services</p>
            <p className="text-gray-500 text-sm">{tpl.companyEmail} · {tpl.companyPhone}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-gray-900">{quote.quote_number}</div>
            <div className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gray-100 text-gray-600 mt-1 capitalize">
              {quote.status}
            </div>
            <p className="text-xs text-gray-400 mt-2">Issued: {formatDate(quote.created_at)}</p>
          </div>
        </div>

        {/* Customer + Vehicle + Meta */}
        <div className="grid grid-cols-3 gap-8 mb-8">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Bill To</p>
            <p className="font-bold text-gray-900">{quote.customer_name}</p>
            <p className="text-gray-600">{quote.customer_phone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Vehicle</p>
            <p className="text-gray-700">{quote.vehicle_info}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Quote Details</p>
            <p className="text-gray-700 text-sm">Valid until: <span className="font-semibold">{formatDate(quote.valid_until)}</span></p>
            <p className="text-gray-500 text-sm">Validity: {quote.valid_days} days</p>
            {quote.created_by && <p className="text-gray-500 text-sm">Prepared by: {quote.created_by}</p>}
          </div>
        </div>

        {/* Services section */}
        {services.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Services</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 text-xs text-gray-400 uppercase tracking-wider font-semibold w-1/2">Description</th>
                  <th className="text-right py-2 text-xs text-gray-400 uppercase tracking-wider font-semibold">Qty</th>
                  <th className="text-right py-2 text-xs text-gray-400 uppercase tracking-wider font-semibold">Unit Price</th>
                  <th className="text-right py-2 text-xs text-gray-400 uppercase tracking-wider font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {services.map(item => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2.5 font-medium text-gray-800">{item.item_name}</td>
                    <td className="py-2.5 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-2.5 text-right text-gray-600">{formatAED(item.unit_cost)}</td>
                    <td className="py-2.5 text-right font-semibold text-gray-900">{formatAED(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Parts section */}
        {parts.length > 0 && (
          <div className="mb-8">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Parts & Materials</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 text-xs text-gray-400 uppercase tracking-wider font-semibold w-1/2">Part</th>
                  <th className="text-right py-2 text-xs text-gray-400 uppercase tracking-wider font-semibold">Qty</th>
                  <th className="text-right py-2 text-xs text-gray-400 uppercase tracking-wider font-semibold">Unit Price</th>
                  <th className="text-right py-2 text-xs text-gray-400 uppercase tracking-wider font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {parts.map(item => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2.5 font-medium text-gray-800">{item.item_name}</td>
                    <td className="py-2.5 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-2.5 text-right text-gray-600">{formatAED(item.unit_cost)}</td>
                    <td className="py-2.5 text-right font-semibold text-gray-900">{formatAED(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatAED(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>VAT (5%)</span>
              <span>{formatAED(quote.vat_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t-2 border-gray-200">
              <span>Total (incl. VAT)</span>
              <span>{formatAED(quote.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Notes</p>
            <p className="text-gray-700 text-sm">{quote.notes}</p>
          </div>
        )}

        <div className="pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
          {tpl.footerText} · {quote.quote_number}
        </div>
      </div>
    </>
  )
}
