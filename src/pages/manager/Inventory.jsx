import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatAED, formatDateTime, formatSignedAmount } from '../../lib/utils'
import {
  Package, AlertTriangle, TrendingUp, Search, Filter,
  Plus, Minus, X, Loader2, ChevronDown, History
} from 'lucide-react'

const LOW_STOCK_THRESHOLD = 5

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

function AdjustModal({ part, onClose, onSave, user }) {
  const [direction, setDirection] = useState('+')
  const [amount, setAmount] = useState(1)
  const [reason, setReason] = useState('Restock from supplier')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const newLevel = direction === '+'
    ? part.stock_level + Number(amount)
    : Math.max(0, part.stock_level - Number(amount))

  const handleSave = async () => {
    if (!amount || Number(amount) < 1) { setError('Enter a valid quantity.'); return }
    setSaving(true)
    setError('')
    try {
      const changeAmount = direction === '+' ? Number(amount) : -Number(amount)

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
    } finally {
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
          {/* Direction toggle */}
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

          {/* Quantity */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Quantity</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-surface-600 border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-500 transition"
            />
          </div>

          {/* Reason */}
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

          {/* Notes */}
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

          {/* Preview */}
          <div className="bg-surface-600 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-slate-400">New stock level</span>
            <span className={`font-bold ${newLevel === 0 ? 'text-red-400' : newLevel < LOW_STOCK_THRESHOLD ? 'text-amber-400' : 'text-emerald-400'}`}>
              {part.stock_level} → {newLevel} {part.unit}s
            </span>
          </div>

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
  const [parts, setParts] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [adjustingPart, setAdjustingPart] = useState(null)

  const fetchData = useCallback(async () => {
    const [{ data: partsData }, { data: movData }] = await Promise.all([
      supabase.from('parts').select('*').order('name'),
      supabase.from('stock_movements')
        .select('*, parts(name)')
        .order('created_at', { ascending: false })
        .limit(50),
    ])
    setParts(partsData || [])
    setMovements(movData || [])
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

  const totalParts = parts.length
  const lowStockCount = parts.filter(p => p.stock_level < LOW_STOCK_THRESHOLD).length
  const totalValue = parts.reduce((s, p) => s + p.stock_level * Number(p.cost), 0)

  const filtered = parts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchLow = !lowStockOnly || p.stock_level < LOW_STOCK_THRESHOLD
    return matchSearch && matchLow
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Parts stock levels and movement history</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Package}
          label="Total Parts"
          value={totalParts}
          sub="in catalogue"
          accent="bg-brand-500/15 text-brand-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock"
          value={lowStockCount}
          sub={`below ${LOW_STOCK_THRESHOLD} units`}
          accent={lowStockCount > 0 ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}
        />
        <StatCard
          icon={TrendingUp}
          label="Stock Value"
          value={formatAED(totalValue)}
          sub="at cost price"
          accent="bg-amber-500/15 text-amber-400"
        />
      </div>

      {/* Filters */}
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
          onClick={() => setLowStockOnly(v => !v)}
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

      {/* Parts List */}
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
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Name + unit */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isLow && <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                      <p className="text-sm font-medium text-white truncate">{part.name}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">{part.unit} · {formatAED(part.cost)} each</p>
                  </div>

                  {/* Stock level */}
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

                  {/* Adjust button */}
                  <button
                    onClick={() => setAdjustingPart(part)}
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

      {/* Movement History */}
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
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
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

      {/* Adjust Modal */}
      {adjustingPart && (
        <AdjustModal
          part={adjustingPart}
          user={user}
          onClose={() => setAdjustingPart(null)}
          onSave={() => { setAdjustingPart(null); fetchData() }}
        />
      )}
    </div>
  )
}
