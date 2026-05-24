import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatAED, normalizePhone } from '../../lib/utils'
import {
  ArrowLeft, User, Car, Wrench, Package, ClipboardList,
  Search, Trash2, Loader2, ChevronDown, PlusCircle, Mail
} from 'lucide-react'

const inputCls = 'w-full bg-surface-600 border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-500 transition'
const labelCls = 'block text-xs text-slate-400 mb-1.5 font-medium'

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-surface-700 border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06]">
        <Icon className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

const VALIDITY_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: 'Custom', value: 'custom' },
]

export default function NewQuote() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [allServices, setAllServices] = useState([])
  const [allParts, setAllParts] = useState([])
  const [customers, setCustomers] = useState([])
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  // Customer section
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('+971')
  const [customerEmail, setCustomerEmail] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupMsg, setLookupMsg] = useState('')

  // Vehicle section
  const [vehicleMake, setVehicleMake] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [vehicleYear, setVehicleYear] = useState('')
  const [existingVehicles, setExistingVehicles] = useState([])
  const [selVehicle, setSelVehicle] = useState('')

  // Items
  const [selService, setSelService] = useState('')
  const [selPart, setSelPart] = useState('')
  const [selQty, setSelQty] = useState(1)

  // Settings
  const [validOption, setValidOption] = useState(7)
  const [customDays, setCustomDays] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    supabase.from('services').select('*').order('name').then(({ data }) => setAllServices(data || []))
    supabase.from('parts').select('*').order('name').then(({ data }) => setAllParts(data || []))
  }, [])

  const lookupCustomer = async () => {
    if (!customerPhone || customerPhone === '+971') return
    setLookupLoading(true)
    setLookupMsg('')
    const { data } = await supabase
      .from('customers')
      .select('*, vehicles(*)')
      .eq('phone', normalizePhone(customerPhone))
      .maybeSingle()

    if (data) {
      setCustomerName(data.name)
      if (data.email) setCustomerEmail(data.email)
      setExistingVehicles(data.vehicles || [])
      setLookupMsg(`Found: ${data.name}`)
    } else {
      setLookupMsg('No existing customer — new customer will be created.')
      setExistingVehicles([])
    }
    setLookupLoading(false)
  }

  const handleVehicleSelect = (vId) => {
    setSelVehicle(vId)
    if (vId) {
      const v = existingVehicles.find(v => v.id === vId)
      if (v) {
        setVehicleMake(v.make)
        setVehicleModel(v.model)
        setVehiclePlate(v.license_plate)
        setVehicleYear(String(v.year || ''))
      }
    } else {
      setVehicleMake('')
      setVehicleModel('')
      setVehiclePlate('')
      setVehicleYear('')
    }
  }

  const addService = () => {
    if (!selService) return
    const svc = allServices.find(s => s.id === selService)
    if (!svc) return
    setItems(prev => [...prev, {
      tempId: crypto.randomUUID(),
      item_type: 'service',
      item_name: svc.name,
      unit_cost: Number(svc.cost),
      quantity: 1,
    }])
    setSelService('')
  }

  const addPart = () => {
    if (!selPart) return
    const part = allParts.find(p => p.id === selPart)
    if (!part) return
    setItems(prev => [...prev, {
      tempId: crypto.randomUUID(),
      item_type: 'part',
      item_name: part.name,
      unit_cost: Number(part.cost),
      quantity: Number(selQty) || 1,
    }])
    setSelPart('')
    setSelQty(1)
  }

  const removeItem = (tempId) => setItems(prev => prev.filter(i => i.tempId !== tempId))

  const validDays = validOption === 'custom' ? (Number(customDays) || 7) : Number(validOption)
  const validUntil = new Date(Date.now() + validDays * 86400000).toISOString().split('T')[0]

  const subtotal = items.reduce((s, i) => s + i.unit_cost * i.quantity, 0)
  const vatAmount = subtotal * 0.05
  const totalAmount = subtotal + vatAmount

  const vehicleInfo = [vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(' ') +
    (vehiclePlate ? ` – ${vehiclePlate}` : '')

  const validate = () => {
    const e = {}
    if (!customerName.trim()) e.customerName = 'Customer name is required.'
    if (!customerPhone.trim() || customerPhone === '+971') e.customerPhone = 'Phone number is required.'
    if (!vehicleMake.trim() || !vehicleModel.trim()) e.vehicle = 'Vehicle make and model are required.'
    if (items.length === 0) e.items = 'Add at least one service or part.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async (status) => {
    if (!validate()) return
    setSaving(true)
    try {
      const { data: qn } = await supabase.rpc('next_quote_number')

      const { data: quote, error: qErr } = await supabase.from('quotations').insert({
        quote_number:   qn,
        customer_name:  customerName.trim(),
        customer_phone: normalizePhone(customerPhone),
        customer_email: customerEmail.trim() || null,
        vehicle_info:   vehicleInfo.trim(),
        status,
        valid_days:     validDays,
        valid_until:    validUntil,
        notes:          notes.trim() || null,
        subtotal,
        vat_amount:     vatAmount,
        total_amount:   totalAmount,
        created_by:     user?.name || 'Receptionist',
      }).select('id').single()

      if (qErr) throw qErr

      const lineItems = items.map(i => ({
        quotation_id: quote.id,
        item_type:    i.item_type,
        item_name:    i.item_name,
        unit_cost:    i.unit_cost,
        quantity:     i.quantity,
      }))
      const { error: liErr } = await supabase.from('quotation_items').insert(lineItems)
      if (liErr) throw liErr

      navigate(`/receptionist/quotes/${quote.id}`)
    } catch (err) {
      alert('Error saving quote: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/receptionist/quotes')}
          className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.06] transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">New Quotation</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create a quote for a customer</p>
        </div>
      </div>

      {/* Customer */}
      <Section title="Customer" icon={User}>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className={labelCls}>Phone Number</label>
              <input
                value={customerPhone}
                onChange={e => { setCustomerPhone(e.target.value); setLookupMsg('') }}
                placeholder="+971501234567"
                className={inputCls}
              />
              {errors.customerPhone && <p className="text-red-400 text-xs mt-1">{errors.customerPhone}</p>}
            </div>
            <div className="flex items-end">
              <button
                onClick={lookupCustomer}
                disabled={lookupLoading}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface-600 border border-white/[0.08] text-slate-300 hover:text-white text-sm font-medium transition disabled:opacity-50"
              >
                {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Look up
              </button>
            </div>
          </div>
          {lookupMsg && (
            <p className={`text-xs ${lookupMsg.startsWith('Found') ? 'text-emerald-400' : 'text-slate-400'}`}>
              {lookupMsg}
            </p>
          )}
          <div>
            <label className={labelCls}>Customer Name</label>
            <input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Full name"
              className={inputCls}
            />
            {errors.customerName && <p className="text-red-400 text-xs mt-1">{errors.customerName}</p>}
          </div>
          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> Email (for sending quote)</span>
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={e => setCustomerEmail(e.target.value)}
              placeholder="customer@email.com"
              className={inputCls}
            />
          </div>
        </div>
      </Section>

      {/* Vehicle */}
      <Section title="Vehicle" icon={Car}>
        <div className="space-y-4">
          {existingVehicles.length > 0 && (
            <div>
              <label className={labelCls}>Select Existing Vehicle</label>
              <div className="relative">
                <select
                  value={selVehicle}
                  onChange={e => handleVehicleSelect(e.target.value)}
                  className={`${inputCls} appearance-none pr-9`}
                >
                  <option value="">Enter manually below</option>
                  {existingVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} – {v.license_plate}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Make</label>
              <input value={vehicleMake} onChange={e => setVehicleMake(e.target.value)} placeholder="Toyota" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Model</label>
              <input value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} placeholder="Camry" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>License Plate</label>
              <input value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} placeholder="DXB-A-12345" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Year</label>
              <input value={vehicleYear} onChange={e => setVehicleYear(e.target.value)} placeholder="2021" className={inputCls} />
            </div>
          </div>
          {errors.vehicle && <p className="text-red-400 text-xs">{errors.vehicle}</p>}
        </div>
      </Section>

      {/* Services & Parts */}
      <Section title="Services & Parts" icon={Wrench}>
        <div className="space-y-5">
          {/* Added items */}
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.tempId} className="flex items-center gap-3 bg-surface-600 rounded-xl px-4 py-3">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0 ${
                    item.item_type === 'service'
                      ? 'text-rose-400 bg-rose-400/10'
                      : 'text-slate-400 bg-slate-400/10'
                  }`}>
                    {item.item_type === 'service' ? 'SVC' : 'PRT'}
                  </span>
                  <span className="flex-1 text-sm text-slate-200 truncate">{item.item_name}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">×{item.quantity}</span>
                  <span className="text-sm font-medium text-white flex-shrink-0">{formatAED(item.unit_cost * item.quantity)}</span>
                  <button onClick={() => removeItem(item.tempId)} className="text-slate-600 hover:text-red-400 transition flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add service */}
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Add Service</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={selService}
                  onChange={e => setSelService(e.target.value)}
                  className={`${inputCls} appearance-none pr-9`}
                >
                  <option value="">Select service...</option>
                  {allServices.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {formatAED(s.cost)}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
              <button
                onClick={addService}
                disabled={!selService}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition disabled:opacity-40"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add part */}
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Add Part</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={selPart}
                  onChange={e => setSelPart(e.target.value)}
                  className={`${inputCls} appearance-none pr-9`}
                >
                  <option value="">Select part...</option>
                  {allParts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {formatAED(p.cost)}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
              <input
                type="number"
                min={1}
                value={selQty}
                onChange={e => setSelQty(e.target.value)}
                className="w-16 bg-surface-600 border border-white/[0.08] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition text-center"
              />
              <button
                onClick={addPart}
                disabled={!selPart}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 text-sm font-semibold transition disabled:opacity-40"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {errors.items && <p className="text-red-400 text-xs">{errors.items}</p>}
        </div>
      </Section>

      {/* Quote Settings */}
      <Section title="Quote Settings" icon={ClipboardList}>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Validity Period</label>
            <div className="grid grid-cols-4 gap-2">
              {VALIDITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setValidOption(opt.value)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border transition ${
                    validOption === opt.value
                      ? 'bg-brand-600/20 border-brand-500/40 text-brand-400'
                      : 'bg-surface-600 border-white/[0.06] text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {validOption === 'custom' && (
              <input
                type="number"
                min={1}
                value={customDays}
                onChange={e => setCustomDays(e.target.value)}
                placeholder="Enter days..."
                className={`${inputCls} mt-2`}
              />
            )}
            <p className="text-xs text-slate-500 mt-2">
              Valid until: <span className="text-slate-300">{new Date(validUntil).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </p>
          </div>
          <div>
            <label className={labelCls}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Any remarks for the customer or internal notes..."
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>
      </Section>

      {/* Summary */}
      <div className="bg-surface-700 border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Summary</h3>
        <div className="space-y-2 text-sm">
          {items.filter(i => i.item_type === 'service').length > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>Services ({items.filter(i => i.item_type === 'service').length})</span>
              <span>{formatAED(items.filter(i => i.item_type === 'service').reduce((s, i) => s + i.unit_cost * i.quantity, 0))}</span>
            </div>
          )}
          {items.filter(i => i.item_type === 'part').length > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>Parts ({items.filter(i => i.item_type === 'part').length})</span>
              <span>{formatAED(items.filter(i => i.item_type === 'part').reduce((s, i) => s + i.unit_cost * i.quantity, 0))}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-300 pt-2 border-t border-white/[0.06]">
            <span>Subtotal</span>
            <span>{formatAED(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>VAT (5%)</span>
            <span>{formatAED(vatAmount)}</span>
          </div>
          <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-white/[0.06]">
            <span>Total</span>
            <span className="text-white">{formatAED(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-4">
        <button
          onClick={() => handleSave('draft')}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-600 border border-white/[0.06] text-slate-300 hover:text-white text-sm font-semibold transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save as Draft
        </button>
        <button
          onClick={() => handleSave('sent')}
          disabled={saving}
          className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save &amp; Mark Sent
        </button>
      </div>
    </div>
  )
}
