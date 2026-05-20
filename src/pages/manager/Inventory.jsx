import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatAED, formatDateTime, formatSignedAmount } from '../../lib/utils'
import {
  Package, AlertTriangle, TrendingUp, Search, Filter,
  Plus, Minus, X, Loader2, ChevronDown, History, Tag, Info, PlusCircle
} from 'lucide-react'

const LOW_STOCK_THRESHOLD = 5

const SAMPLE_PARTS = [
  { id: 'demo-1',  name: 'Engine Oil 5W-30 (5L)',   cost: 85.00,  unit: 'bottle', stock_level: 24, category: 'Oils & Fluids' },
  { id: 'demo-2',  name: 'Oil Filter',              cost: 35.00,  unit: 'piece',  stock_level: 30, category: 'Filters'       },
  { id: 'demo-3',  name: 'Air Filter',              cost: 60.00,  unit: 'piece',  stock_level: 18, category: 'Filters'       },
  { id: 'demo-4',  name: 'Fuel Filter',             cost: 45.00,  unit: 'piece',  stock_level: 12, category: 'Filters'       },
  { id: 'demo-5',  name: 'Brake Pads (Front Set)',  cost: 180.00, unit: 'set',    stock_level: 8,  category: 'Brakes'        },
  { id: 'demo-6',  name: 'Brake Pads (Rear Set)',   cost: 160.00, unit: 'set',    stock_level: 8,  category: 'Brakes'        },
  { id: 'demo-7',  name: 'Car Battery 70Ah',        cost: 280.00, unit: 'piece',  stock_level: 6,  category: 'Electrical'    },
  { id: 'demo-8',  name: 'Spark Plugs (Set of 4)',  cost: 120.00, unit: 'set',    stock_level: 10, category: 'Electrical'    },
  { id: 'demo-9',  name: 'Wiper Blades (Pair)',     cost: 65.00,  unit: 'pair',   stock_level: 15, category: 'Exterior'      },
  { id: 'demo-10', name: 'Coolant Antifreeze (1L)', cost: 25.00,  unit: 'liter',  stock_level: 20, category: 'Oils & Fluids' },
  { id: 'demo-11', name: 'Power Steering Fluid',    cost: 30.00,  unit: 'bottle', stock_level: 12, category: 'Oils & Fluids' },
  { id: 'demo-12', name: 'Transmission Fluid (1L)', cost: 45.00,  unit: 'liter',  stock_level: 14, category: 'Oils & Fluids' },
  { id: 'demo-13', name: 'Brake Fluid DOT4',        cost: 20.00,  unit: 'bottle', stock_level: 16, category: 'Brakes'        },
  { id: 'demo-14', name: 'Serpentine Belt',         cost: 95.00,  unit: 'piece',  stock_level: 7,  category: 'Engine'        },
  { id: 'demo-15', name: 'Timing Belt',             cost: 250.00, unit: 'piece',  stock_level: 4,  category: 'Engine'        },
  { id: 'demo-16', name: 'Radiator Cap',            cost: 40.00,  unit: 'piece',  stock_level: 10, category: 'Cooling'       },
  { id: 'demo-17', name: 'Thermostat',              cost: 85.00,  unit: 'piece',  stock_level: 6,  category: 'Cooling'       },
  { id: 'demo-18', name: 'Water Pump',              cost: 220.00, unit: 'piece',  stock_level: 4,  category: 'Cooling'       },
  { id: 'demo-19', name: 'Alternator',              cost: 650.00, unit: 'piece',  stock_level: 2,  category: 'Electrical'    },
  { id: 'demo-20', name: 'Starter Motor',           cost: 480.00, unit: 'piece',  stock_level: 2,  category: 'Engine'        },
]

const SAMPLE_MOVEMENTS = [
  { id: 'mv-1', parts: { name: 'Engine Oil 5W-30 (5L)' },   change_amount:  12, reason: 'Restock from supplier', notes: 'Monthly delivery',       created_by: 'Manager',            created_at: new Date(Date.now() - 2  * 3600000).toISOString() },
  { id: 'mv-2', parts: { name: 'Oil Filter' },              change_amount:  -2, reason: 'Used in job',           notes: 'JOB-0001 · JOB-0004',     created_by: 'Rashid Al-Mansoori', created_at: new Date(Date.now() - 3  * 3600000).toISOString() },
  { id: 'mv-3', parts: { name: 'Car Battery 70Ah' },        change_amount:  -1, reason: 'Used in job',           notes: 'JOB-0002',                created_by: 'Ahmed Hassan',       created_at: new Date(Date.now() - 4  * 3600000).toISOString() },
  { id: 'mv-4', parts: { name: 'Brake Pads (Front Set)' },  change_amount:  -1, reason: 'Used in job',           notes: 'JOB-0003',                created_by: 'Fahad Al-Qasimi',    created_at: new Date(Date.now() - 5  * 3600000).toISOString() },
  { id: 'mv-5', parts: { name: 'Timing Belt' },             change_amount:   5, reason: 'Restock from supplier', notes: 'Emergency restock',       created_by: 'Manager',            created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: 'mv-6', parts: { name: 'Alternator' },              change_amount:   2, reason: 'Restock from supplier', notes: 'Quarterly order',         created_by: 'Manager',            created_at: new Date(Date.now() - 26 * 3600000).toISOString() },
  { id: 'mv-7', parts: { name: 'Spark Plugs (Set of 4)' },  change_amount:  -1, reason: 'Used in job',           notes: 'JOB-0004',                created_by: 'Mohammed Khalid',    created_at: new Date(Date.now() - 27 * 3600000).toISOString() },
  { id: 'mv-8', parts: { name: 'Coolant Antifreeze (1L)' }, change_amount:  -2, reason: 'Used in job',           notes: 'JOB-0005',                created_by: 'Rashid Al-Mansoori', created_at: new Date(Date.now() - 28 * 3600000).toISOString() },
]

const CATEGORIES = ['All', 'Oils & Fluids', 'Filters', 'Brakes', 'Electrical', 'Engine', 'Cooling', 'Exterior']
const PART_CATEGORIES = ['Oils & Fluids', 'Filters', 'Brakes', 'Electrical', 'Engine', 'Cooling', 'Exterior']
const UNITS = ['piece', 'set', 'pair', 'bottle', 'liter', 'box', 'kit', 'roll']

const CATEGORY_COLORS = {
  'Oils & Fluids': 'bg-amber-500/15 text-amber-400',
  'Filters':       'bg-sky-500/15 text-sky-400',
  'Brakes':        'bg-red-500/15 text-red-400',
  'Electrical':    'bg-yellow-500/15 text-yellow-400',
  'Engine':        'bg-orange-500/15 text-orange-400',
  'Cooling':       'bg-cyan-500/15 text-cyan-400',
  'Exterior':      'bg-emerald-500/15 text-emerald-400',
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-surface-700 border border-white/[0.06] rounded-2xl p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function AddPartModal({ onClose, onSave, isDemo }) {
  const [name, setName]           = useState('')
  const [cost, setCost]           = useState('')
  const [unit, setUnit]           = useState('piece')
  const [stockLevel, setStock]    = useState('0')
  const [category, setCategory]   = useState('Engine')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const handleSave = async () => {
    if (!name.trim())                    { setError('Part name is required.'); return }
    if (!cost || Number(cost) <= 0)      { setError('Enter a valid cost greater than 0.'); return }
    if (Number(stockLevel) < 0)          { setError('Stock level cannot be negative.'); return }
    setSaving(true)
    setError('')

    if (isDemo) {
      onSave({
        id: `demo-${Date.now()}`,
        name: name.trim(),
        cost: Number(cost),
        unit,
        stock_level: Number(stockLevel),
        category,
      })
      return
    }

    try {
      const { error: err } = await supabase.from('parts').insert({
        name:        name.trim(),
        cost:        Number(cost),
        unit,
        stock_level: Number(stockLevel),
      })
      if (err) throw err
      onSave()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const field = 'w-full bg-surface-600 border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-500 transition'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-surface-700 border border-white/[0.08] rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-bold text-white">Add New Part</h2>
            <p className="text-xs text-slate-400 mt-0.5">Add a part to the catalogue</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition p-1 rounded-lg hover:bg-white/[0.06]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Part Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Brake Caliper Front Left"
              className={field}
            />
          </div>

          {/* Cost */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Unit Cost (AED) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={cost}
              onChange={e => setCost(e.target.value)}
              placeholder="0.00"
              className={field}
            />
          </div>

          {/* Unit + Stock row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Unit</label>
              <div className="relative">
                <select value={unit} onChange={e => setUnit(e.target.value)} className={`${field} appearance-none pr-9`}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Initial Stock</label>
              <input
                type="number"
                min="0"
                value={stockLevel}
                onChange={e => setStock(e.target.value)}
                className={field}
              />
            </div>
          </div>

          {/* Category (demo mode only) */}
          {isDemo && (
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Category</label>
              <div className="relative">
                <select value={category} onChange={e => setCategory(e.target.value)} className={`${field} appearance-none pr-9`}>
                  {PART_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Preview */}
          {name && cost && (
            <div className="bg-surface-600 rounded-xl px-4 py-3 text-xs text-slate-400 space-y-0.5">
              <div className="flex justify-between">
                <span>Part</span>
                <span className="text-slate-200 font-medium">{name}</span>
              </div>
              <div className="flex justify-between">
                <span>Cost</span>
                <span className="text-amber-400 font-semibold">AED {Number(cost).toFixed(2)} / {unit}</span>
              </div>
              <div className="flex justify-between">
                <span>Opening stock</span>
                <span className={`font-semibold ${Number(stockLevel) < LOW_STOCK_THRESHOLD ? 'text-red-400' : 'text-emerald-400'}`}>
                  {stockLevel} {unit}s
                </span>
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-surface-600 text-slate-300 text-sm font-medium hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
              Add Part
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdjustModal({ part, onClose, onSave, user, isDemo }) {
  const [direction, setDirection] = useState('+')
  const [amount, setAmount]       = useState(1)
  const [reason, setReason]       = useState('Restock from supplier')
  const [notes, setNotes]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const newLevel = direction === '+'
    ? part.stock_level + Number(amount)
    : Math.max(0, part.stock_level - Number(amount))

  const handleSave = async () => {
    if (!amount || Number(amount) < 1) { setError('Enter a valid quantity.'); return }
    setSaving(true)
    setError('')
    const changeAmount = direction === '+' ? Number(amount) : -Number(amount)

    if (isDemo) {
      onSave({ partId: part.id, partName: part.name, newLevel, changeAmount, reason, notes: notes || null })
      return
    }

    try {
      const { error: upErr } = await supabase
        .from('parts')
        .update({ stock_level: newLevel })
        .eq('id', part.id)
      if (upErr) throw upErr

      const { error: mvErr } = await supabase.from('stock_movements').insert({
        part_id:       part.id,
        change_amount: changeAmount,
        reason,
        notes:         notes || null,
        created_by:    user?.name || 'Manager',
      })
      if (mvErr) throw mvErr

      onSave()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-surface-700 border border-white/[0.08] rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-bold text-white">Adjust Stock</h2>
            <p className="text-xs text-slate-400 mt-0.5">{part.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition p-1 rounded-lg hover:bg-white/[0.06]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium">Adjustment Type</p>
            <div className="grid grid-cols-2 gap-2">
              {[{ val: '+', icon: Plus, label: 'Add Stock' }, { val: '-', icon: Minus, label: 'Remove Stock' }].map(({ val, icon: Icon, label }) => (
                <button
                  key={val}
                  onClick={() => setDirection(val)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition ${
                    direction === val
                      ? val === '+'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-red-500/20 border-red-500/40 text-red-400'
                      : 'bg-surface-600 border-white/[0.06] text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Quantity</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-surface-600 border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Reason</label>
            <div className="relative">
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full appearance-none bg-surface-600 border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition pr-9"
              >
                <option>Restock from supplier</option>
                <option>Damaged / Written off</option>
                <option>Correction / Count adjustment</option>
                <option>Returned to supplier</option>
                <option>Other</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional details..."
              className="w-full bg-surface-600 border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-500 transition resize-none"
            />
          </div>

          <div className="bg-surface-600 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-slate-400">New stock level</span>
            <span className={`font-bold ${newLevel === 0 ? 'text-red-400' : newLevel < LOW_STOCK_THRESHOLD ? 'text-amber-400' : 'text-emerald-400'}`}>
              {part.stock_level} → {newLevel} {part.unit}s
            </span>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-surface-600 text-slate-300 text-sm font-medium hover:text-white transition">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Adjustment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Inventory() {
  const { user } = useAuth()
  const [parts, setParts]             = useState([])
  const [movements, setMovements]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [isDemo, setIsDemo]           = useState(false)
  const [search, setSearch]           = useState('')
  const [lowStockOnly, setLowStock]   = useState(false)
  const [category, setCategory]       = useState('All')
  const [adjustingPart, setAdjPart]   = useState(null)
  const [addingPart, setAddingPart]   = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [{ data: partsData }, { data: movData }] = await Promise.all([
        supabase.from('parts').select('*').order('name'),
        supabase.from('stock_movements')
          .select('*, parts(name)')
          .order('created_at', { ascending: false })
          .limit(50),
      ])
      if (partsData && partsData.length > 0) {
        setParts(partsData)
        setMovements(movData || [])
        setIsDemo(false)
      } else {
        setParts(SAMPLE_PARTS)
        setMovements(SAMPLE_MOVEMENTS)
        setIsDemo(true)
      }
    } catch {
      setParts(SAMPLE_PARTS)
      setMovements(SAMPLE_MOVEMENTS)
      setIsDemo(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('inventory-parts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parts' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_movements' }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchData])

  const handleAddSave = (newPart) => {
    if (isDemo) {
      setParts(prev => [...prev, newPart].sort((a, b) => a.name.localeCompare(b.name)))
      setMovements(prev => [{
        id: `mv-${Date.now()}`,
        parts: { name: newPart.name },
        change_amount: newPart.stock_level,
        reason: 'New part added to catalogue',
        notes: null,
        created_by: user?.name || 'Manager',
        created_at: new Date().toISOString(),
      }, ...prev])
    } else {
      fetchData()
    }
    setAddingPart(false)
  }

  const handleAdjustSave = (data) => {
    if (isDemo) {
      setParts(prev => prev.map(p => p.id === data.partId ? { ...p, stock_level: data.newLevel } : p))
      setMovements(prev => [{
        id: `mv-${Date.now()}`,
        parts: { name: data.partName },
        change_amount: data.changeAmount,
        reason: data.reason,
        notes: data.notes,
        created_by: user?.name || 'Manager',
        created_at: new Date().toISOString(),
      }, ...prev])
      setAdjPart(null)
    } else {
      setAdjPart(null)
      fetchData()
    }
  }

  const totalParts    = parts.length
  const lowStockCount = parts.filter(p => p.stock_level < LOW_STOCK_THRESHOLD).length
  const totalValue    = parts.reduce((s, p) => s + p.stock_level * Number(p.cost), 0)

  const filtered = parts.filter(p => {
    const matchSearch   = p.name.toLowerCase().includes(search.toLowerCase())
    const matchLow      = !lowStockOnly || p.stock_level < LOW_STOCK_THRESHOLD
    const matchCategory = category === 'All' || p.category === category
    return matchSearch && matchLow && matchCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Parts stock levels and movement history</p>
        </div>
        <button
          onClick={() => setAddingPart(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition"
        >
          <PlusCircle className="w-4 h-4" />
          Add Part
        </button>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300 leading-relaxed">
            Showing <span className="font-semibold">sample inventory data</span> — 20 automotive parts across 7 categories.
            Connect Supabase and run <span className="font-mono bg-black/20 px-1 rounded">seed.sql</span> to load live data.
            Changes here update this session only.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Package}       label="Total Parts"  value={totalParts}           sub="in catalogue"                   accent="bg-brand-500/15 text-brand-400" />
        <StatCard icon={AlertTriangle} label="Low Stock"    value={lowStockCount}         sub={`below ${LOW_STOCK_THRESHOLD} units`} accent={lowStockCount > 0 ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'} />
        <StatCard icon={TrendingUp}    label="Stock Value"  value={formatAED(totalValue)} sub="at cost price"                  accent="bg-amber-500/15 text-amber-400" />
      </div>

      {/* Search + low-stock filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search parts..."
            className="w-full bg-surface-700 border border-white/[0.06] text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-500 transition"
          />
        </div>
        <button
          onClick={() => setLowStock(v => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
            lowStockOnly
              ? 'bg-red-500/20 border-red-500/40 text-red-400'
              : 'bg-surface-700 border-white/[0.06] text-slate-400 hover:text-white'
          }`}
        >
          <Filter className="w-4 h-4" />
          Low stock only
        </button>
      </div>

      {/* Category filter */}
      {isDemo && (
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                category === cat
                  ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                  : 'bg-surface-700 border-white/[0.06] text-slate-500 hover:text-slate-300'
              }`}
            >
              {cat !== 'All' && <Tag className="w-3 h-3" />}
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Parts catalogue */}
      <div className="bg-surface-700 border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06]">
          <Package className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Parts Catalogue</h3>
          <span className="ml-auto text-xs text-slate-500">{filtered.length} parts</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No parts match your filter.</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((part, i) => {
              const isLow = part.stock_level < LOW_STOCK_THRESHOLD
              const isOut = part.stock_level === 0
              return (
                <div
                  key={part.id}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] animate-fade-up ${
                    isLow ? 'border-l-2 border-l-red-500 bg-red-500/[0.03]' : ''
                  }`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isLow && <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                      <p className="text-sm font-medium text-white truncate">{part.name}</p>
                      {part.category && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider flex-shrink-0 ${CATEGORY_COLORS[part.category] || 'bg-slate-500/15 text-slate-400'}`}>
                          {part.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">{part.unit} · {formatAED(part.cost)} each</p>
                  </div>

                  <div className="text-right flex-shrink-0 min-w-[90px]">
                    {isOut ? (
                      <span className="inline-block text-[10px] font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full animate-pulse-soft uppercase tracking-wider">
                        Out of Stock
                      </span>
                    ) : (
                      <span className={`text-lg font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>
                        {part.stock_level}
                      </span>
                    )}
                    {!isOut && <p className="text-[10px] text-slate-600 capitalize">{part.unit}s</p>}
                  </div>

                  <button
                    onClick={() => setAdjPart(part)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-surface-600 border border-white/[0.06] text-slate-400 hover:text-white hover:border-brand-500/30 hover:bg-brand-500/10 text-xs font-medium transition"
                  >
                    Adjust
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Movement history */}
      <div className="bg-surface-700 border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06]">
          <History className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Movement History</h3>
          <span className="ml-auto text-xs text-slate-500">Last 50 entries</span>
        </div>

        {movements.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-sm">No stock movements yet.</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {movements.map(mv => {
              const isPositive = mv.change_amount > 0
              return (
                <div key={mv.id} className="flex items-center gap-4 px-5 py-3.5 text-sm hover:bg-white/[0.02] transition-colors">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                  }`}>
                    {isPositive ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 font-medium truncate">{mv.parts?.name || 'Unknown Part'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{mv.reason}{mv.notes ? ` · ${mv.notes}` : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatSignedAmount(mv.change_amount)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{mv.created_by}</p>
                  </div>
                  <p className="text-xs text-slate-600 flex-shrink-0 w-28 text-right hidden sm:block">
                    {formatDateTime(mv.created_at)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {addingPart && (
        <AddPartModal
          isDemo={isDemo}
          onClose={() => setAddingPart(false)}
          onSave={handleAddSave}
        />
      )}

      {adjustingPart && (
        <AdjustModal
          part={adjustingPart}
          user={user}
          isDemo={isDemo}
          onClose={() => setAdjPart(null)}
          onSave={handleAdjustSave}
        />
      )}
    </div>
  )
}
