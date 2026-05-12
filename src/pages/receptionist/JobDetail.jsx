import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  formatAED, formatElapsed, elapsedSeconds,
  formatTime, formatDateTime, statusColor
} from '../../lib/utils'
import {
  ArrowLeft, Clock, CheckCircle2, Wrench, Package,
  PlusCircle, Trash2, Loader2, MessageSquare, Mail,
  CreditCard, Banknote, X, ChevronDown, Receipt
} from 'lucide-react'

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
    <span className="font-mono text-blue-400 text-lg font-semibold">
      {formatElapsed(secs)}
    </span>
  )
}

// ── Section wrapper ─────────────────────────────────────────
function Section({ title, icon: Icon, accent, children }) {
  return (
    <div className="bg-surface-700 border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className={`flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] ${accent || ''}`}>
        <Icon className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── Invoice Sent Modal ─────────────────────────────────────
function InvoiceSentModal({ invoice, job, onMarkPaid, onClose }) {
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
              { icon: MessageSquare, color: 'text-blue-400', text: `SMS sent to ${job.customers?.phone}` },
              ...(job.customers?.email ? [{ icon: Mail, color: 'text-purple-400', text: `Email sent to ${job.customers.email}` }] : []),
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
            <div className="flex justify-between font-bold text-white text-base border-t border-white/10 pt-3">
              <span>Total</span>
              <span className="text-gold-400">{formatAED(invoice.total_amount)}</span>
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

  const [job, setJob] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [allServices, setAllServices] = useState([])
  const [allParts, setAllParts] = useState([])
  const [jobServices, setJobServices] = useState([])
  const [jobParts, setJobParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // add-service state
  const [selService, setSelService] = useState('')
  // add-part state
  const [selPart, setSelPart] = useState('')
  const [selQty, setSelQty] = useState(1)

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

  const addService = async () => {
    if (!selService) return
    const svc = allServices.find(s => s.id === selService)
    if (!svc) return
    const { error } = await supabase.from('job_services').insert({
      job_id: id, service_id: svc.id, service_name: svc.name, service_cost: svc.cost
    })
    if (!error) { setSelService(''); fetchJob() }
  }

  const removeService = async (lineId) => {
    await supabase.from('job_services').delete().eq('id', lineId)
    fetchJob()
  }

  const addPart = async () => {
    if (!selPart) return
    const part = allParts.find(p => p.id === selPart)
    if (!part) return
    const { error } = await supabase.from('job_parts').insert({
      job_id: id, part_id: part.id, part_name: part.name, part_cost: part.cost, quantity: selQty
    })
    if (!error) { setSelPart(''); setSelQty(1); fetchJob() }
  }

  const removePart = async (lineId) => {
    await supabase.from('job_parts').delete().eq('id', lineId)
    fetchJob()
  }

  const serviceTotal = jobServices.reduce((s, l) => s + Number(l.service_cost), 0)
  const partsTotal = jobParts.reduce((s, l) => s + Number(l.part_cost) * l.quantity, 0)
  const grandTotal = serviceTotal + partsTotal

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
        total_amount: grandTotal,
        status: 'sent',
        sent_via: job.customers?.email ? 'sms,email' : 'sms',
      }).select().single()

      if (invErr) throw invErr
      setInvoice(inv)
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
  if (!job) return <div className="p-6 text-slate-400">Job not found.</div>

  const isOpen = job.status === 'open'
  const isPaid = invoice?.status === 'paid'

  const selectCls = "w-full bg-surface-600 border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer"

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
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
            <Clock className={`w-5 h-5 ${isOpen ? 'text-blue-400' : 'text-slate-500'}`} />
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
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <select className={selectCls} value={selService} onChange={e => setSelService(e.target.value)}>
                  <option value="">Select service to add...</option>
                  {allServices.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {formatAED(s.cost)}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <button
                onClick={addService}
                disabled={!selService}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-40"
              >
                <PlusCircle className="w-4 h-4" /> Add Service
              </button>
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
                <select className={selectCls} value={selPart} onChange={e => setSelPart(e.target.value)}>
                  <option value="">Select part to add...</option>
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
                  onClick={addPart}
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
        <Section title="Invoice Preview" icon={Receipt}>
          <div className="space-y-2 text-sm mb-4">
            {jobServices.map(l => (
              <div key={l.id} className="flex justify-between text-slate-300">
                <span>{l.service_name}</span>
                <span>{formatAED(l.service_cost)}</span>
              </div>
            ))}
            {jobParts.map(l => (
              <div key={l.id} className="flex justify-between text-slate-300">
                <span>{l.part_name} ×{l.quantity}</span>
                <span>{formatAED(Number(l.part_cost) * l.quantity)}</span>
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
                <div className="border-t border-white/[0.06] pt-3 flex justify-between font-bold text-white text-base">
                  <span>Total Amount</span>
                  <span className="text-gold-400 text-lg">{formatAED(grandTotal)}</span>
                </div>
              </>
            )}
          </div>

          {/* Action buttons */}
          {isOpen && (
            <button
              onClick={completeAndInvoice}
              disabled={completing || (jobServices.length === 0 && jobParts.length === 0)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {completing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Invoice...</>
                : <><CheckCircle2 className="w-4 h-4" /> Complete & Generate Invoice</>
              }
            </button>
          )}

          {!isOpen && invoice && invoice.status === 'sent' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-400/10 rounded-xl px-4 py-2.5">
                <Receipt className="w-4 h-4" />
                Invoice {invoice.invoice_number} sent — awaiting payment
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
                  className="flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
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
          onMarkPaid={markPaid}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
