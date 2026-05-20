import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, User, Phone, Mail, Car, Wrench, FileText, Loader2 } from 'lucide-react'

const MAKES = ['Toyota', 'Nissan', 'Honda', 'BMW', 'Mercedes', 'Hyundai', 'Kia', 'Ford', 'Chevrolet', 'Mitsubishi', 'Lexus', 'Infiniti', 'Land Rover', 'Jeep', 'Audi', 'Volkswagen', 'Other']

function FormField({ label, icon: Icon, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />}
          {label}
        </span>
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

const inputCls = "w-full bg-surface-600 border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-500 transition"

export default function NewJob() {
  const navigate = useNavigate()
  const [mechanics, setMechanics] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '+971',
    customerEmail: '',
    vehicleMake: '',
    vehicleModel: '',
    licensePlate: '',
    vehicleYear: '',
    mechanicId: '',
    description: '',
  })

  useEffect(() => {
    supabase.from('mechanics').select('*').eq('status', 'active').order('name')
      .then(({ data }) => setMechanics(data || []))

    // Pre-fill from quote conversion
    const prefill = sessionStorage.getItem('prefill_job')
    if (prefill) {
      try {
        const data = JSON.parse(prefill)
        setForm(f => ({
          ...f,
          customerName:  data.customerName  || f.customerName,
          customerPhone: data.customerPhone || f.customerPhone,
        }))
      } catch (_) {}
      sessionStorage.removeItem('prefill_job')
    }
  }, [])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.customerName.trim()) e.customerName = 'Name is required'
    if (!form.customerPhone || form.customerPhone.length < 10) e.customerPhone = 'Valid phone required'
    if (!form.vehicleMake) e.vehicleMake = 'Vehicle make required'
    if (!form.vehicleModel.trim()) e.vehicleModel = 'Vehicle model required'
    if (!form.licensePlate.trim()) e.licensePlate = 'License plate required'
    if (!form.mechanicId) e.mechanicId = 'Select a mechanic'
    if (!form.description.trim()) e.description = 'Describe the issue'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    try {
      // 1. Upsert customer (by phone)
      let customerId
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', form.customerPhone)
        .maybeSingle()

      if (existing) {
        customerId = existing.id
      } else {
        const { data: newCust, error: custErr } = await supabase
          .from('customers')
          .insert({ name: form.customerName, phone: form.customerPhone, email: form.customerEmail || null })
          .select('id')
          .single()
        if (custErr) throw custErr
        customerId = newCust.id
      }

      // 2. Create vehicle
      const { data: vehicle, error: vehErr } = await supabase
        .from('vehicles')
        .insert({
          customer_id: customerId,
          make: form.vehicleMake,
          model: form.vehicleModel,
          license_plate: form.licensePlate.toUpperCase(),
          year: form.vehicleYear ? parseInt(form.vehicleYear) : null,
        })
        .select('id')
        .single()
      if (vehErr) throw vehErr

      // 3. Generate job number
      const { data: jobNumData } = await supabase.rpc('next_job_number')

      // 4. Create job
      const { data: job, error: jobErr } = await supabase
        .from('jobs')
        .insert({
          job_number: jobNumData,
          customer_id: customerId,
          vehicle_id: vehicle.id,
          mechanic_id: form.mechanicId,
          status: 'open',
          description: form.description,
        })
        .select('id')
        .single()
      if (jobErr) throw jobErr

      navigate(`/receptionist/jobs/${job.id}`)
    } catch (err) {
      console.error(err)
      setErrors({ submit: err.message || 'Failed to create job. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/receptionist')}
          className="p-2 rounded-xl bg-surface-700 border border-white/[0.06] text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Job</h1>
          <p className="text-slate-400 text-sm">Timer starts when job is created</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer section */}
        <div className="bg-surface-700 border border-white/[0.06] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-400" /> Customer Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name *" icon={User} error={errors.customerName}>
              <input className={inputCls} placeholder="Ahmed Al-Rashid" value={form.customerName} onChange={set('customerName')} />
            </FormField>
            <FormField label="Phone *" icon={Phone} error={errors.customerPhone}>
              <input className={inputCls} placeholder="+971501234567" value={form.customerPhone} onChange={set('customerPhone')} />
            </FormField>
            <FormField label="Email" icon={Mail}>
              <input className={inputCls} type="email" placeholder="customer@email.com" value={form.customerEmail} onChange={set('customerEmail')} />
            </FormField>
          </div>
        </div>

        {/* Vehicle section */}
        <div className="bg-surface-700 border border-white/[0.06] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Car className="w-4 h-4 text-brand-400" /> Vehicle Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Make *" error={errors.vehicleMake}>
              <select className={inputCls + ' appearance-none cursor-pointer'} value={form.vehicleMake} onChange={set('vehicleMake')}>
                <option value="">Select make...</option>
                {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </FormField>
            <FormField label="Model *" error={errors.vehicleModel}>
              <input className={inputCls} placeholder="Camry, Patrol, Civic..." value={form.vehicleModel} onChange={set('vehicleModel')} />
            </FormField>
            <FormField label="License Plate *" error={errors.licensePlate}>
              <input className={inputCls} placeholder="DXB-A-12345" value={form.licensePlate} onChange={set('licensePlate')} />
            </FormField>
            <FormField label="Year">
              <input className={inputCls} type="number" placeholder="2022" min="1990" max="2030" value={form.vehicleYear} onChange={set('vehicleYear')} />
            </FormField>
          </div>
        </div>

        {/* Job section */}
        <div className="bg-surface-700 border border-white/[0.06] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-brand-400" /> Job Details
          </h2>
          <div className="space-y-4">
            <FormField label="Assign Mechanic *" icon={Wrench} error={errors.mechanicId}>
              <select className={inputCls + ' appearance-none cursor-pointer'} value={form.mechanicId} onChange={set('mechanicId')}>
                <option value="">Select mechanic...</option>
                {mechanics.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Issue Description *" icon={FileText} error={errors.description}>
              <textarea
                className={inputCls + ' resize-none'}
                rows={3}
                placeholder="e.g. Oil change needed, Battery not starting, Strange noise from engine..."
                value={form.description}
                onChange={set('description')}
              />
            </FormField>
          </div>
        </div>

        {errors.submit && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/receptionist')}
            className="flex-1 bg-surface-700 border border-white/[0.06] text-slate-300 hover:text-white font-medium py-3 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-brand-600/20 disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating Job...</>
            ) : (
              <><Wrench className="w-4 h-4" /> Create Job & Start Timer</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
