import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  formatAED, formatElapsed, elapsedSeconds,
  formatTime, formatDateTime, statusColor,
  calculateLineVat, calculateInvoiceTotals,
} from '../../lib/utils'
import {
  ArrowLeft, Clock, CheckCircle2, Wrench, Package,
  PlusCircle, Trash2, Loader2, MessageSquare, Mail,
  CreditCard, Banknote, X, ChevronDown, Receipt, Printer
} from 'lucide-react'
import { renderInvoiceToHtml } from '../../components/InvoicePrintTemplate'

// ── Live timer ─────────────────────────────────────────────
function LiveTimer({ createdAt, completedAt }) {
  const [secs, setSecs] = useState(
    completedAt
      ? Math.floor((new Date(completedAt) - new Date(createdAt)) / 1000)
      : elapsedSeconds(createdAt)
  )
  useEffect(() => {
    if (completedAt) return
    const t = setInterval(() => setSecs(elapsedSeconds(createdAt)), 1000)
    return () => clearInterval(t)
  }, [createdAt, completedAt])
  return (
    <span className="font-mono text-lg font-semibold" style={{ color: 'var(--accent-400)' }}>
      {formatElapsed(secs)}
    </span>
  )
}

// ── Section wrapper ─────────────────────────────────────────
function Section({ title, icon: Icon, accent, action, children }) {
  return (
    <div className="bg-surface-700 border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className={`flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] ${accent || ''}`}>
        <Icon className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex-1">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── Invoice Sent Modal ─────────────────────────────────────
function InvoiceSentModal({ invoice, job, emailSent, onMarkPaid, onClose }) {
  const [payMethod, setPayMethod] = useState('cash')
  const [marking, setMarking] = useState(false)

  const handlePay = async () => {
    setMarking(true)
    await onMarkPaid(payMethod)
    setMarking(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-surface-700 border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">Invoice Generated</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success items */}
          <div className="space-y-2.5 mb-5">
            {[
              { icon: CheckCircle2, color: 'text-emerald-400', text: `Invoice ${invoice.invoice_number} created` },
              { icon: CheckCircle2, color: 'text-emerald-400', text: `Total: ${formatAED(invoice.total_amount)}` },
              { icon: MessageSquare, color: 'text-rose-400', text: `SMS sent to ${job.customers?.phone}` },
              ...(job.customers?.email
                ? [emailSent
                    ? { icon: Mail, color: 'text-purple-400', text: `Invoice emailed to ${job.customers.email}` }
                    : { icon: Mail, color: 'text-slate-500', text: `Email failed — check Resend config` }]
                : [{ icon: Mail, color: 'text-slate-500', text: 'No email on customer record' }]),
            ].map(({ icon: Icon, color, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
                <span className="text-sm text-slate-300">{text}</span>
              </div>
            ))}
          </div>

          {/* Invoice breakdown */}
          <div className="bg-surface-600 rounded-xl p-4 mb-5 text-sm">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Services</span>
              <span>{formatAED(invoice.service_total)}</span>
            </div>
            <div className="flex justify-between text-slate-400 mb-3">
              <span>Parts</span>
              <span>{formatAED(invoice.parts_total)}</span>
            </div>
            {Number(invoice.tax_total) > 0 && (
              <>
                <div className="flex justify-between text-slate-400 mb-1 border-t border-white/10 pt-2">
                  <span>Net Amount</span>
                  <span>{formatAED(invoice.net_amount ?? invoice.total_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-400 mb-2">
                  <span>VAT</span>
                  <span>{formatAED(invoice.tax_total)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-white text-base border-t border-white/10 pt-3">
              <span>Total Due</span>
              <span className="text-gold-400">{formatAED(invoice.payable_amount ?? invoice.total_amount)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="mb-5">
            <p className="text-sm font-medium text-slate-300 mb-2">Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              {[{ val: 'cash', icon: Banknote, label: 'Cash' }, { val: 'card', icon: CreditCard, label: 'Card' }].map(({ val, icon: Icon, label }) => (
                <button
                  key={val}
                  onClick={() => setPayMethod(val)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition ${
                    payMethod === val
                      ? 'bg-brand-600/20 border-brand-600/40 text-brand-400'
                      : 'bg-surface-600 border-white/[0.06] text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-surface-600 text-slate-300 text-sm font-medium hover:text-white transition"
            >
              Done
            </button>
            <button
              onClick={handlePay}
              disabled={marking}
              className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition disabled:opacity-60"
            >
              {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Mark as Paid
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────
export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [job, setJob] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [allServices, setAllServices] = useState([])
  const [allParts, setAllParts] = useState([])
  const [jobServices, setJobServices] = useState([])
  const [jobParts, setJobParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // add-service state
  const [selService, setSelService] = useState('')
  // add-part state
  const [selPart, setSelPart] = useState('')
  const [selQty, setSelQty] = useState(1)

  // UAE eInvoicing fields
  const [einvoicing] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pitstop_einvoicing') || '{}') } catch { return {} }
  })
  const [dueDate, setDueDate] = useState(() => {
    const days = (() => {
      try { return JSON.parse(localStorage.getItem('pitstop_einvoicing') || '{}').defaultDueDays ?? 30 } catch { return 30 }
    })()
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  })
  const [buyerIsBusiness, setBuyerIsBusiness] = useState(false)
  const [buyerLegalIdType, setBuyerLegalIdType] = useState('TL')
  const [buyerLegalIdNumber, setBuyerLegalIdNumber] = useState('')
  const [buyerStreet, setBuyerStreet] = useState('')
  const [buyerCity, setBuyerCity] = useState('')
  const [buyerCountry, setBuyerCountry] = useState('AE')
  const [buyerPostalCode, setBuyerPostalCode] = useState('')
  const [showTxnFlags, setShowTxnFlags] = useState(false)
  const [isFreeTradeZone, setIsFreeTradeZone] = useState(false)
  const [isDeemedSupply, setIsDeemedSupply] = useState(false)
  const [isMarginScheme, setIsMarginScheme] = useState(false)
  const [isEcommerce, setIsEcommerce] = useState(false)
  const [isExport, setIsExport] = useState(false)

  const fetchJob = useCallback(async () => {
    const [{ data: jobData }, { data: svcData }, { data: partData }] = await Promise.all([
      supabase.from('jobs').select(`
        *, customers(*), vehicles(*), mechanics(name)
      `).eq('id', id).single(),
      supabase.from('job_services').select('*').eq('job_id', id),
      supabase.from('job_parts').select('*').eq('job_id', id),
    ])
    setJob(jobData)
    setJobServices(svcData || [])
    setJobParts(partData || [])

    const { data: inv } = await supabase.from('invoices').select('*').eq('job_id', id).maybeSingle()
    setInvoice(inv)
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchJob()
    supabase.from('services').select('*').order('name').then(({ data }) => setAllServices(data || []))
    supabase.from('parts').select('*').order('name').then(({ data }) => setAllParts(data || []))
  }, [fetchJob])

  const addService = async (serviceId) => {
    const sid = serviceId ?? selService
    if (!sid) return
    const svc = allServices.find(s => s.id === sid)
    if (!svc) return
    const defaultVatRate = einvoicing.defaultVatRate ?? 0
    const { vatAmount, lineTotal } = calculateLineVat(svc.cost, defaultVatRate)
    const { error } = await supabase.from('job_services').insert({
      job_id: id, service_id: svc.id, service_name: svc.name, service_cost: svc.cost,
      vat_rate: defaultVatRate, vat_amount: vatAmount, line_total: lineTotal, unit_code: 'HUR',
    })
    if (!error) await fetchJob()
  }

  const removeService = async (lineId) => {
    await supabase.from('job_services').delete().eq('id', lineId)
    fetchJob()
  }

  const addPart = async (partId, qty) => {
    const pid = partId ?? selPart
    const pqty = qty ?? selQty
    if (!pid) return
    const part = allParts.find(p => p.id === pid)
    if (!part) return
    const defaultVatRate = einvoicing.defaultVatRate ?? 0
    const lineNet = part.cost * pqty
    const { vatAmount, lineTotal } = calculateLineVat(lineNet, defaultVatRate)
    const { error } = await supabase.from('job_parts').insert({
      job_id: id, part_id: part.id, part_name: part.name, part_cost: part.cost, quantity: pqty,
      vat_rate: defaultVatRate, vat_amount: vatAmount, line_total: lineTotal, unit_code: 'EA',
    })
    if (!error) { setSelPart(''); setSelQty(1); await fetchJob() }
  }

  const removePart = async (lineId) => {
    await supabase.from('job_parts').delete().eq('id', lineId)
    fetchJob()
  }

  const serviceTotal = jobServices.reduce((s, l) => s + Number(l.service_cost), 0)
  const partsTotal = jobParts.reduce((s, l) => s + Number(l.part_cost) * l.quantity, 0)
  const { netAmount, taxTotal, payableAmount } = calculateInvoiceTotals(jobServices, jobParts)
  const grandTotal = payableAmount

  const saveServiceVat = async (lineId, vatRate) => {
    const cost = Number(jobServices.find(l => l.id === lineId)?.service_cost || 0)
    const { vatAmount, lineTotal } = calculateLineVat(cost, vatRate)
    setJobServices(prev => prev.map(l => l.id === lineId ? { ...l, vat_rate: vatRate, vat_amount: vatAmount, line_total: lineTotal } : l))
    await supabase.from('job_services').update({ vat_rate: vatRate, vat_amount: vatAmount, line_total: lineTotal }).eq('id', lineId)
  }

  const savePartVat = async (lineId, vatRate) => {
    const line = jobParts.find(l => l.id === lineId)
    const cost = Number(line?.part_cost || 0) * (line?.quantity || 1)
    const { vatAmount, lineTotal } = calculateLineVat(cost, vatRate)
    setJobParts(prev => prev.map(l => l.id === lineId ? { ...l, vat_rate: vatRate, vat_amount: vatAmount, line_total: lineTotal } : l))
    await supabase.from('job_parts').update({ vat_rate: vatRate, vat_amount: vatAmount, line_total: lineTotal }).eq('id', lineId)
  }

  const updateServiceCostLocal = (lineId, val) => {
    setJobServices(prev => prev.map(l => l.id === lineId ? { ...l, service_cost: val } : l))
  }
  const saveServiceCost = async (lineId, val) => {
    const num = parseFloat(val) || 0
    const vatRate = jobServices.find(l => l.id === lineId)?.vat_rate ?? 0
    const { vatAmount, lineTotal } = calculateLineVat(num, vatRate)
    setJobServices(prev => prev.map(l => l.id === lineId ? { ...l, service_cost: num, vat_amount: vatAmount, line_total: lineTotal } : l))
    await supabase.from('job_services').update({ service_cost: num, vat_amount: vatAmount, line_total: lineTotal }).eq('id', lineId)
  }
  const updatePartCostLocal = (lineId, val) => {
    setJobParts(prev => prev.map(l => l.id === lineId ? { ...l, part_cost: val } : l))
  }
  const savePartCost = async (lineId, val) => {
    const num = parseFloat(val) || 0
    const line = jobParts.find(l => l.id === lineId)
    const vatRate = line?.vat_rate ?? 0
    const lineNet = num * (line?.quantity || 1)
    const { vatAmount, lineTotal } = calculateLineVat(lineNet, vatRate)
    setJobParts(prev => prev.map(l => l.id === lineId ? { ...l, part_cost: num, vat_amount: vatAmount, line_total: lineTotal } : l))
    await supabase.from('job_parts').update({ part_cost: num, vat_amount: vatAmount, line_total: lineTotal }).eq('id', lineId)
  }

  const generateInvoiceOnly = async () => {
    if (jobServices.length === 0 && jobParts.length === 0) {
      alert('Add at least one service or part before generating an invoice.')
      return
    }
    setCompleting(true)
    try {
      const { data: invNumData } = await supabase.rpc('next_invoice_number')
      const { data: inv, error: invErr } = await supabase.from('invoices').insert({
        invoice_number: invNumData,
        job_id: id,
        customer_phone: job.customers?.phone,
        customer_email: job.customers?.email,
        service_total: serviceTotal,
        parts_total: partsTotal,
        total_amount: payableAmount,
        net_amount: netAmount,
        tax_total: taxTotal,
        total_with_tax: payableAmount,
        payable_amount: payableAmount,
        currency_code: 'AED',
        accounting_currency: 'AED',
        invoice_type_code: '380',
        due_date: dueDate || null,
        is_free_trade_zone: isFreeTradeZone,
        is_deemed_supply: isDeemedSupply,
        is_margin_scheme: isMarginScheme,
        is_e_commerce: isEcommerce,
        is_export: isExport,
        buyer_is_business: buyerIsBusiness,
        buyer_legal_id_type: buyerIsBusiness ? buyerLegalIdType : null,
        buyer_legal_id_number: buyerIsBusiness ? buyerLegalIdNumber : null,
        buyer_street: buyerIsBusiness ? buyerStreet : null,
        buyer_city: buyerIsBusiness ? buyerCity : null,
        buyer_country: buyerIsBusiness ? buyerCountry : null,
        buyer_postal_code: buyerIsBusiness ? buyerPostalCode : null,
        status: 'sent',
        sent_via: job.customers?.email ? 'sms,email' : 'sms',
      }).select().single()
      if (invErr) throw invErr
      setInvoice(inv)
      await fetchJob()
      const sent = await sendInvoiceEmail(inv)
      setEmailSent(!!sent)
      setShowModal(true)
    } catch (err) {
      alert('Error generating invoice: ' + err.message)
    } finally {
      setCompleting(false)
    }
  }

  const completeAndInvoice = async () => {
    if (jobServices.length === 0 && jobParts.length === 0) {
      alert('Please add at least one service or part before completing.')
      return
    }
    setCompleting(true)
    try {
      const now = new Date().toISOString()
      const elapsed = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 1000)

      await supabase.from('jobs').update({
        status: 'complete',
        completed_at: now,
        elapsed_time_seconds: elapsed,
      }).eq('id', id)

      const { data: invNumData } = await supabase.rpc('next_invoice_number')

      const { data: inv, error: invErr } = await supabase.from('invoices').insert({
        invoice_number: invNumData,
        job_id: id,
        customer_phone: job.customers?.phone,
        customer_email: job.customers?.email,
        service_total: serviceTotal,
        parts_total: partsTotal,
        total_amount: payableAmount,
        net_amount: netAmount,
        tax_total: taxTotal,
        total_with_tax: payableAmount,
        payable_amount: payableAmount,
        currency_code: 'AED',
        accounting_currency: 'AED',
        invoice_type_code: '380',
        due_date: dueDate || null,
        is_free_trade_zone: isFreeTradeZone,
        is_deemed_supply: isDeemedSupply,
        is_margin_scheme: isMarginScheme,
        is_e_commerce: isEcommerce,
        is_export: isExport,
        buyer_is_business: buyerIsBusiness,
        buyer_legal_id_type: buyerIsBusiness ? buyerLegalIdType : null,
        buyer_legal_id_number: buyerIsBusiness ? buyerLegalIdNumber : null,
        buyer_street: buyerIsBusiness ? buyerStreet : null,
        buyer_city: buyerIsBusiness ? buyerCity : null,
        buyer_country: buyerIsBusiness ? buyerCountry : null,
        buyer_postal_code: buyerIsBusiness ? buyerPostalCode : null,
        status: 'sent',
        sent_via: job.customers?.email ? 'sms,email' : 'sms',
      }).select().single()

      if (invErr) throw invErr
      setInvoice(inv)
      const sent = await sendInvoiceEmail(inv)
      setEmailSent(!!sent)

      // Decrement stock for each part used in this job
      if (jobParts.length > 0) {
        const movements = []
        for (const line of jobParts) {
          if (!line.part_id) continue
          await supabase.rpc('decrement_part_stock', {
            p_part_id: line.part_id,
            p_qty:     line.quantity,
          })
          movements.push({
            part_id:       line.part_id,
            change_amount: -line.quantity,
            reason:        'job_usage',
            notes:         `Auto-deducted on job completion: ${job.job_number}`,
            created_by:    user?.name || 'system',
            job_id:        id,
          })
        }
        if (movements.length > 0) {
          await supabase.from('stock_movements').insert(movements)
        }
      }

      await fetchJob()
      setShowModal(true)
    } catch (err) {
      console.error(err)
      alert('Error completing job: ' + err.message)
    } finally {
      setCompleting(false)
    }
  }

  const markPaid = async (payMethod) => {
    const { error } = await supabase.from('invoices').update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: payMethod,
    }).eq('id', invoice.id)
    if (!error) { await fetchJob(); setShowModal(false) }
  }

  const printInvoice = () => {
    const templateId = localStorage.getItem('pitstop_invoice_style') || 'classic'
    const logoDataUrl = localStorage.getItem('pitstop_logo') || ''
    const html = renderInvoiceToHtml({ invoice, job, jobServices, jobParts, templateId, logoDataUrl })
    const win = window.open('', '_blank', 'width=820,height=1000')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.onload = () => { win.print(); win.onafterprint = () => win.close() }
  }

  const sendInvoiceEmail = async (inv) => {
    if (!job.customers?.email) return false
    const templateId = localStorage.getItem('pitstop_invoice_style') || 'classic'
    const logoDataUrl = localStorage.getItem('pitstop_logo') || ''
    const invoiceHtml = renderInvoiceToHtml({ invoice: inv, job, jobServices, jobParts, templateId, logoDataUrl })
    const { error } = await supabase.functions.invoke('send-invoice', {
      body: {
        to: job.customers.email,
        invoiceHtml,
        invoiceNumber: inv.invoice_number,
        totalAmount: inv.total_amount,
        customerName: job.customers.name,
      },
    })
    return !error
  }

  const markPaidFromDetail = async (payMethod) => {
    const { error } = await supabase.from('invoices').update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: payMethod,
    }).eq('id', invoice.id)
    if (!error) await fetchJob()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading job...
      </div>
    )
  }
  if (!job) return <div style={{ color: 'var(--text-muted)', padding: '40px 0', textAlign: 'center' }}>Job not found.</div>

  const isOpen = job.status === 'open'
  const isPaid = invoice?.status === 'paid'

  const selectCls = "w-full bg-surface-600 border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer"

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/receptionist')}
          className="p-2 rounded-xl bg-surface-700 border border-white/[0.06] text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{job.job_number}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${statusColor(job.status)}`}>
              {isOpen ? 'In Progress' : 'Complete'}
            </span>
            {invoice && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${statusColor(invoice.status)}`}>
                Invoice {isPaid ? 'Paid' : 'Pending Payment'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Job info */}
        <Section title="Job Info" icon={Wrench}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Customer</p>
              <p className="text-white font-medium">{job.customers?.name}</p>
              <p className="text-slate-400 text-xs">{job.customers?.phone}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Vehicle</p>
              <p className="text-white font-medium">{job.vehicles?.make} {job.vehicles?.model}</p>
              <p className="text-slate-400 text-xs">{job.vehicles?.license_plate} · {job.vehicles?.year}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Mechanic</p>
              <p className="text-white font-medium">{job.mechanics?.name}</p>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <p className="text-slate-500 text-xs mb-0.5">Issue</p>
              <p className="text-slate-300">{job.description}</p>
            </div>
          </div>

          {/* Timer */}
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-3">
            <Clock className={`w-5 h-5 ${isOpen ? 'text-rose-400' : 'text-slate-500'}`} />
            <div>
              <p className="text-xs text-slate-500 mb-0.5">
                {isOpen ? 'Elapsed time (live)' : `Completed · ${formatDateTime(job.completed_at)}`}
              </p>
              <LiveTimer createdAt={job.created_at} completedAt={job.completed_at} />
            </div>
            <div className="ml-auto text-xs text-slate-500">
              Started {formatTime(job.created_at)}
            </div>
          </div>
        </Section>

        {/* Services */}
        <Section title="Services Done" icon={Wrench}>
          {jobServices.length > 0 && (
            <div className="space-y-2 mb-4">
              {jobServices.map(line => (
                <div key={line.id} className="flex items-center justify-between bg-surface-600 rounded-xl px-4 py-2.5">
                  <span className="text-sm text-white">{line.service_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gold-400">{formatAED(line.service_cost)}</span>
                    {isOpen && (
                      <button onClick={() => removeService(line.id)} className="text-slate-500 hover:text-red-400 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isOpen && (
            <div className="relative">
              <select
                className={selectCls}
                value={selService}
                onChange={async (e) => {
                  const val = e.target.value
                  if (!val) return
                  setSelService(val)
                  await addService(val)
                  setSelService('')
                }}
              >
                <option value="">+ Select service to add...</option>
                {allServices.map(s => (
                  <option key={s.id} value={s.id}>{s.name} — {formatAED(s.cost)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          )}

          {jobServices.length === 0 && !isOpen && (
            <p className="text-slate-500 text-sm">No services logged.</p>
          )}
        </Section>

        {/* Parts */}
        <Section title="Parts Used" icon={Package}>
          {jobParts.length > 0 && (
            <div className="space-y-2 mb-4">
              {jobParts.map(line => (
                <div key={line.id} className="flex items-center justify-between bg-surface-600 rounded-xl px-4 py-2.5">
                  <span className="text-sm text-white">{line.part_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">×{line.quantity}</span>
                    <span className="text-sm font-semibold text-gold-400">
                      {formatAED(Number(line.part_cost) * line.quantity)}
                    </span>
                    {isOpen && (
                      <button onClick={() => removePart(line.id)} className="text-slate-500 hover:text-red-400 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isOpen && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <select
                  className={selectCls}
                  value={selPart}
                  onChange={e => setSelPart(e.target.value)}
                >
                  <option value="">+ Select part to add...</option>
                  {allParts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {formatAED(p.cost)} / {p.unit}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={selQty}
                  onChange={e => setSelQty(Number(e.target.value))}
                  className="w-20 bg-surface-600 border border-white/[0.08] text-white rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  onClick={() => addPart()}
                  disabled={!selPart}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-40"
                >
                  <PlusCircle className="w-4 h-4" /> Add Part
                </button>
              </div>
            </div>
          )}

          {jobParts.length === 0 && !isOpen && (
            <p className="text-slate-500 text-sm">No parts logged.</p>
          )}
        </Section>

        {/* Invoice preview */}
        <Section title="Invoice Preview" icon={Receipt} action={invoice ? (
          <button
            onClick={printInvoice}
            title="Print / Download Invoice"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-600 border border-white/[0.08] text-slate-300 hover:text-white text-xs font-medium transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        ) : null}>
          {/* Editable hint — only shown when no invoice generated yet */}
          {!invoice && isOpen && (jobServices.length + jobParts.length) > 0 && (
            <p className="text-xs text-slate-500 mb-3">
              Adjust item costs below if needed — total updates automatically.
            </p>
          )}

          <div className="space-y-2 text-sm mb-4">
            {jobServices.map(l => (
              <div key={l.id} className="flex items-center justify-between gap-2 text-slate-300 flex-wrap">
                <span className="flex-1 truncate min-w-0">{l.service_name}</span>
                {!invoice ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                    <span className="text-slate-500 text-xs">AED</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.service_cost}
                      onChange={e => updateServiceCostLocal(l.id, e.target.value)}
                      onBlur={e => saveServiceCost(l.id, e.target.value)}
                      className="w-20 text-right bg-surface-600 border border-white/[0.08] text-white rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <select
                      value={l.vat_rate ?? 0}
                      onChange={e => saveServiceVat(l.id, Number(e.target.value))}
                      className="text-xs bg-surface-600 border border-white/[0.08] text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value={0}>0% VAT</option>
                      <option value={5}>5% VAT</option>
                      <option value={-1}>Exempt</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-shrink-0 text-xs text-slate-400">
                    <span>{formatAED(l.service_cost)}</span>
                    {Number(l.vat_amount) > 0 && <span className="text-slate-500">+{formatAED(l.vat_amount)} VAT</span>}
                  </div>
                )}
              </div>
            ))}
            {jobParts.map(l => (
              <div key={l.id} className="flex items-center justify-between gap-2 text-slate-300 flex-wrap">
                <span className="flex-1 truncate min-w-0">{l.part_name} <span className="text-slate-500">×{l.quantity}</span></span>
                {!invoice ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                    <span className="text-slate-500 text-xs">AED/unit</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.part_cost}
                      onChange={e => updatePartCostLocal(l.id, e.target.value)}
                      onBlur={e => savePartCost(l.id, e.target.value)}
                      className="w-20 text-right bg-surface-600 border border-white/[0.08] text-white rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <select
                      value={l.vat_rate ?? 0}
                      onChange={e => savePartVat(l.id, Number(e.target.value))}
                      className="text-xs bg-surface-600 border border-white/[0.08] text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value={0}>0% VAT</option>
                      <option value={5}>5% VAT</option>
                      <option value={-1}>Exempt</option>
                    </select>
                    <span className="text-slate-500 text-xs min-w-[55px] text-right">
                      = {formatAED(Number(l.part_cost) * l.quantity)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-shrink-0 text-xs text-slate-400">
                    <span>{formatAED(Number(l.part_cost) * l.quantity)}</span>
                    {Number(l.vat_amount) > 0 && <span className="text-slate-500">+{formatAED(l.vat_amount)} VAT</span>}
                  </div>
                )}
              </div>
            ))}

            {(jobServices.length + jobParts.length) === 0 && (
              <p className="text-slate-500 text-center py-2">Add services and parts to see invoice preview</p>
            )}

            {(jobServices.length + jobParts.length) > 0 && (
              <>
                <div className="border-t border-white/[0.06] pt-3 flex justify-between text-slate-400">
                  <span>Services subtotal</span>
                  <span>{formatAED(serviceTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Parts subtotal</span>
                  <span>{formatAED(partsTotal)}</span>
                </div>
                {taxTotal > 0 && (
                  <>
                    <div className="flex justify-between text-slate-400 border-t border-white/[0.06] pt-2">
                      <span>Net Amount</span>
                      <span>{formatAED(netAmount)}</span>
                    </div>
                    <div className="flex justify-between text-amber-400/80">
                      <span>VAT</span>
                      <span>+ {formatAED(taxTotal)}</span>
                    </div>
                  </>
                )}
                <div className="border-t border-white/[0.06] pt-3 flex justify-between font-bold text-white text-base">
                  <span>Total Amount Due</span>
                  <span className="text-gold-400 text-lg">{formatAED(grandTotal)}</span>
                </div>
              </>
            )}
          </div>

          {/* eInvoicing fields — shown only before invoice is generated */}
          {!invoice && isOpen && (jobServices.length + jobParts.length) > 0 && (
            <div className="space-y-3 mb-4 border-t border-white/[0.06] pt-4">
              {/* Due date */}
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-400 w-24 flex-shrink-0">Payment Due</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="flex-1 bg-surface-600 border border-white/[0.08] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Business customer toggle */}
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-400 w-24 flex-shrink-0">Business Customer</label>
                <button
                  onClick={() => setBuyerIsBusiness(v => !v)}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${buyerIsBusiness ? 'bg-brand-600' : 'bg-surface-500'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${buyerIsBusiness ? 'left-5' : 'left-0.5'}`} />
                </button>
                {!buyerIsBusiness && <span className="text-xs text-slate-500">Individual customer</span>}
              </div>

              {/* B2B buyer fields */}
              {buyerIsBusiness && (
                <div className="bg-surface-600 rounded-xl p-4 space-y-3">
                  <p className="text-xs text-slate-400 font-medium">Business Buyer Details</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <select
                        value={buyerLegalIdType}
                        onChange={e => setBuyerLegalIdType(e.target.value)}
                        className="w-full bg-surface-700 border border-white/[0.08] text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 appearance-none pr-7"
                      >
                        <option value="TL">TL — Trade License</option>
                        <option value="EID">EID — Emirates ID</option>
                        <option value="PAS">PAS — Passport</option>
                        <option value="CD">CD — Cabinet Decision</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    </div>
                    <input
                      value={buyerLegalIdNumber}
                      onChange={e => setBuyerLegalIdNumber(e.target.value)}
                      placeholder="Registration number"
                      className="bg-surface-700 border border-white/[0.08] text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <input
                      value={buyerStreet}
                      onChange={e => setBuyerStreet(e.target.value)}
                      placeholder="Street address"
                      className="bg-surface-700 border border-white/[0.08] text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <input
                      value={buyerCity}
                      onChange={e => setBuyerCity(e.target.value)}
                      placeholder="City"
                      className="bg-surface-700 border border-white/[0.08] text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <input
                      value={buyerPostalCode}
                      onChange={e => setBuyerPostalCode(e.target.value)}
                      placeholder="Postal code"
                      className="bg-surface-700 border border-white/[0.08] text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <input
                      value={buyerCountry}
                      onChange={e => setBuyerCountry(e.target.value.toUpperCase().slice(0, 2))}
                      placeholder="AE"
                      maxLength={2}
                      className="bg-surface-700 border border-white/[0.08] text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              )}

              {/* Transaction type flags (collapsible) */}
              <button
                onClick={() => setShowTxnFlags(v => !v)}
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTxnFlags ? 'rotate-180' : ''}`} />
                Transaction type flags {[isFreeTradeZone, isDeemedSupply, isMarginScheme, isEcommerce, isExport].some(Boolean) && <span className="text-brand-400">· active</span>}
              </button>
              {showTxnFlags && (
                <div className="bg-surface-600 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: 'Free Trade Zone', val: isFreeTradeZone, set: setIsFreeTradeZone },
                    { label: 'Deemed Supply', val: isDeemedSupply, set: setIsDeemedSupply },
                    { label: 'Margin Scheme', val: isMarginScheme, set: setIsMarginScheme },
                    { label: 'E-Commerce', val: isEcommerce, set: setIsEcommerce },
                    { label: 'Export', val: isExport, set: setIsExport },
                  ].map(({ label, val, set: setFn }) => (
                    <label key={label} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={e => setFn(e.target.checked)}
                        className="w-3.5 h-3.5 rounded accent-brand-500"
                      />
                      <span className="text-xs text-slate-400">{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {!invoice && isOpen && (
            <div className="space-y-2">
              <button
                onClick={completeAndInvoice}
                disabled={completing}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {completing
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  : <><CheckCircle2 className="w-4 h-4" /> Complete Job & Generate Invoice</>
                }
              </button>
              {(jobServices.length + jobParts.length) > 0 && (
                <button
                  onClick={generateInvoiceOnly}
                  disabled={completing}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface-600 border border-white/[0.08] hover:border-brand-500/40 text-slate-300 hover:text-white text-sm font-medium rounded-xl transition disabled:opacity-50"
                >
                  {completing
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                    : <><Receipt className="w-4 h-4" /> Generate Invoice Only</>
                  }
                </button>
              )}
            </div>
          )}

          {invoice && invoice.status === 'sent' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-400/10 rounded-xl px-4 py-2.5">
                <Receipt className="w-4 h-4" />
                <span>Invoice {invoice.invoice_number} sent — awaiting payment</span>
                {invoice.due_date && (
                  <span className="ml-auto text-xs text-slate-500">Due {new Date(invoice.due_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => markPaidFromDetail('cash')}
                  className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition"
                >
                  <Banknote className="w-4 h-4" /> Pay (Cash)
                </button>
                <button
                  onClick={() => markPaidFromDetail('card')}
                  className="flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition"
                >
                  <CreditCard className="w-4 h-4" /> Pay (Card)
                </button>
              </div>
            </div>
          )}

          {isPaid && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div className="text-sm">
                <p className="text-emerald-400 font-medium">Payment Received</p>
                <p className="text-slate-400 text-xs capitalize">
                  {invoice.payment_method} · {formatDateTime(invoice.paid_at)}
                </p>
              </div>
              <span className="ml-auto font-bold text-gold-400">{formatAED(invoice.total_amount)}</span>
            </div>
          )}
        </Section>
      </div>

      {showModal && invoice && (
        <InvoiceSentModal
          invoice={invoice}
          job={job}
          emailSent={emailSent}
          onMarkPaid={markPaid}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
