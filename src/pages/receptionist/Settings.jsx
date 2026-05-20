import { useState } from 'react'
import {
  Users, Wrench, FileText, Plus, Trash2, Save,
  X, ChevronDown, Phone, Mail, Clock, Edit2, Check
} from 'lucide-react'

/* ── Local-storage helpers ───────────────────────────── */
function load(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

/* ── Defaults ────────────────────────────────────────── */
const DEFAULT_STAFF = [
  { id: 1, name: 'Mariam Al-Zaabi',    role: 'Receptionist', phone: '+971 50 111 2233' },
  { id: 2, name: 'Saeed Al-Mansoori',  role: 'Manager',      phone: '+971 50 222 3344' },
  { id: 3, name: 'Rashid Al-Mansoori', role: 'Technician',   phone: '+971 50 333 4455' },
  { id: 4, name: 'Ahmed Hassan',       role: 'Technician',   phone: '+971 50 444 5566' },
  { id: 5, name: 'Fahad Al-Qasimi',    role: 'Technician',   phone: '+971 50 555 6677' },
]

const DEFAULT_CATALOGUE = [
  { id: 1, name: 'Oil Change',             category: 'Service',    price: 120  },
  { id: 2, name: 'AC Service',             category: 'Cooling',    price: 350  },
  { id: 3, name: 'Brake Inspection',       category: 'Brakes',     price: 80   },
  { id: 4, name: 'Full Service',           category: 'Service',    price: 650  },
  { id: 5, name: 'Engine Diagnostic',      category: 'Engine',     price: 150  },
  { id: 6, name: 'Wheel Alignment',        category: 'Exterior',   price: 120  },
  { id: 7, name: 'Tire Rotation',          category: 'Exterior',   price: 60   },
  { id: 8, name: 'Coolant Flush',          category: 'Cooling',    price: 180  },
  { id: 9, name: 'Transmission Service',   category: 'Drivetrain', price: 450  },
  { id: 10, name: 'Brake Pad Replacement', category: 'Brakes',     price: 320  },
]

const DEFAULT_TEMPLATE = {
  companyName:     'Pitstop Garage',
  companyPhone:    '+971 4 123 4567',
  companyEmail:    'info@pitstop.ae',
  defaultValidity: 14,
  footerText:      'Prices are inclusive of 5% VAT. This quote is valid for the stated validity period.',
}

const STAFF_ROLES   = ['Receptionist', 'Manager', 'Technician', 'Supervisor', 'Driver', 'Other']
const SVC_CATEGORIES = ['Service', 'Brakes', 'Engine', 'Cooling', 'Electrical', 'Exterior', 'Drivetrain', 'Oils & Fluids', 'Other']

/* ── Shared field style ──────────────────────────────── */
const FIELD = 'w-full bg-surface-600 border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-500 transition'

/* ── Tab button ──────────────────────────────────────── */
function Tab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${
        active
          ? 'bg-brand-600/20 border-brand-500/40 text-brand-400'
          : 'bg-surface-700 border-white/[0.06] text-slate-500 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}

/* ── Saved indicator ─────────────────────────────────── */
function SavedBadge({ show }) {
  if (!show) return null
  return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
      <Check className="w-3.5 h-3.5" /> Saved
    </span>
  )
}

/* ══════════════════════════════════════════════════════ */
/*  Tab 1 — Staff                                        */
/* ══════════════════════════════════════════════════════ */
function StaffTab() {
  const [staff, setStaff]     = useState(() => load('pitstop_staff', DEFAULT_STAFF))
  const [adding, setAdding]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [form, setForm]       = useState({ name: '', role: 'Technician', phone: '' })
  const [editId, setEditId]   = useState(null)
  const [editForm, setEditForm] = useState({})

  const persist = (next) => {
    setStaff(next)
    save('pitstop_staff', next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAdd = () => {
    if (!form.name.trim()) return
    const next = [...staff, { id: Date.now(), ...form, name: form.name.trim() }]
    persist(next)
    setForm({ name: '', role: 'Technician', phone: '' })
    setAdding(false)
  }

  const handleRemove = (id) => persist(staff.filter(s => s.id !== id))

  const startEdit = (s) => { setEditId(s.id); setEditForm({ ...s }) }
  const cancelEdit = () => setEditId(null)
  const saveEdit = () => {
    if (!editForm.name.trim()) return
    persist(staff.map(s => s.id === editId ? { ...editForm, name: editForm.name.trim() } : s))
    setEditId(null)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Staff Members</h2>
          <p className="text-xs text-slate-500 mt-0.5">{staff.length} people on your team</p>
        </div>
        <div className="flex items-center gap-3">
          <SavedBadge show={saved} />
          <button
            onClick={() => setAdding(v => !v)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-surface-700 border border-brand-500/20 rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-sm font-semibold text-white">New Staff Member</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Full name *"
              className={FIELD}
            />
            <div className="relative">
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className={`${FIELD} appearance-none pr-9`}
              >
                {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
            <input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="Phone (optional)"
              className={FIELD}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-xl bg-surface-600 text-slate-400 text-sm hover:text-white transition">Cancel</button>
            <button onClick={handleAdd} className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition">Add Member</button>
          </div>
        </div>
      )}

      {/* Staff table */}
      <div className="bg-surface-700 border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="divide-y divide-white/[0.04]">
          {staff.map(s => (
            <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition">
              {editId === s.id ? (
                /* Inline edit row */
                <>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className={FIELD}
                    />
                    <div className="relative">
                      <select
                        value={editForm.role}
                        onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                        className={`${FIELD} appearance-none pr-9`}
                      >
                        {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                    <input
                      value={editForm.phone}
                      onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                      className={FIELD}
                    />
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={saveEdit} className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"><Check className="w-4 h-4" /></button>
                    <button onClick={cancelEdit} className="p-2 rounded-lg bg-surface-600 text-slate-400 hover:text-white transition"><X className="w-4 h-4" /></button>
                  </div>
                </>
              ) : (
                /* Display row */
                <>
                  <div className="avatar sm flex-shrink-0" style={{ fontSize: 10 }}>
                    {s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200">{s.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                      <span>{s.role}</span>
                      {s.phone && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => startEdit(s)} className="p-2 rounded-lg bg-surface-600 text-slate-400 hover:text-white transition"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleRemove(s.id)} className="p-2 rounded-lg bg-surface-600 text-slate-400 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════ */
/*  Tab 2 — Service Catalogue                            */
/* ══════════════════════════════════════════════════════ */
const CAT_COLORS = {
  Service: 'bg-brand-500/15 text-brand-400',
  Brakes: 'bg-red-500/15 text-red-400',
  Engine: 'bg-orange-500/15 text-orange-400',
  Cooling: 'bg-cyan-500/15 text-cyan-400',
  Electrical: 'bg-yellow-500/15 text-yellow-400',
  Exterior: 'bg-emerald-500/15 text-emerald-400',
  Drivetrain: 'bg-purple-500/15 text-purple-400',
  'Oils & Fluids': 'bg-amber-500/15 text-amber-400',
  Other: 'bg-slate-500/15 text-slate-400',
}

function CatalogueTab() {
  const [items, setItems]   = useState(() => load('pitstop_service_catalogue', DEFAULT_CATALOGUE))
  const [adding, setAdding] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [form, setForm]     = useState({ name: '', category: 'Service', price: '' })
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})

  const persist = (next) => {
    setItems(next)
    save('pitstop_service_catalogue', next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAdd = () => {
    if (!form.name.trim() || !form.price) return
    persist([...items, { id: Date.now(), name: form.name.trim(), category: form.category, price: Number(form.price) }])
    setForm({ name: '', category: 'Service', price: '' })
    setAdding(false)
  }

  const handleRemove = (id) => persist(items.filter(i => i.id !== id))
  const startEdit = (item) => { setEditId(item.id); setEditForm({ ...item }) }
  const cancelEdit = () => setEditId(null)
  const saveEdit = () => {
    if (!editForm.name.trim()) return
    persist(items.map(i => i.id === editId ? { ...editForm, price: Number(editForm.price) } : i))
    setEditId(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Service Catalogue</h2>
          <p className="text-xs text-slate-500 mt-0.5">{items.length} services · used as suggestions when creating quotes</p>
        </div>
        <div className="flex items-center gap-3">
          <SavedBadge show={saved} />
          <button
            onClick={() => setAdding(v => !v)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
        </div>
      </div>

      {adding && (
        <div className="bg-surface-700 border border-brand-500/20 rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-sm font-semibold text-white">New Service</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Service name *"
              className={FIELD}
            />
            <div className="relative">
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className={`${FIELD} appearance-none pr-9`}
              >
                {SVC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">AED</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
                className={`${FIELD} pl-12`}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-xl bg-surface-600 text-slate-400 text-sm hover:text-white transition">Cancel</button>
            <button onClick={handleAdd} className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition">Add Service</button>
          </div>
        </div>
      )}

      <div className="bg-surface-700 border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="flex items-center px-5 py-3 border-b border-white/[0.06] text-xs text-slate-500 uppercase tracking-wider font-semibold">
          <span className="flex-1">Service</span>
          <span className="w-28 text-center hidden sm:block">Category</span>
          <span className="w-28 text-right">Price (AED)</span>
          <span className="w-20" />
        </div>
        <div className="divide-y divide-white/[0.04]">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition">
              {editId === item.id ? (
                <>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={FIELD} />
                    <div className="relative">
                      <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} className={`${FIELD} appearance-none pr-9`}>
                        {SVC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">AED</span>
                      <input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} className={`${FIELD} pl-12`} />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={saveEdit} className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"><Check className="w-4 h-4" /></button>
                    <button onClick={cancelEdit} className="p-2 rounded-lg bg-surface-600 text-slate-400 hover:text-white transition"><X className="w-4 h-4" /></button>
                  </div>
                </>
              ) : (
                <>
                  <p className="flex-1 text-sm text-slate-200 font-medium min-w-0 truncate">{item.name}</p>
                  <span className={`w-28 text-center text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider hidden sm:inline-block ${CAT_COLORS[item.category] || CAT_COLORS.Other}`}>
                    {item.category}
                  </span>
                  <p className="w-28 text-right text-sm font-semibold text-amber-400">
                    {Number(item.price).toFixed(2)}
                  </p>
                  <div className="w-20 flex justify-end gap-2">
                    <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg bg-surface-600 text-slate-400 hover:text-white transition"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleRemove(item.id)} className="p-1.5 rounded-lg bg-surface-600 text-slate-400 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════ */
/*  Tab 3 — Quotation Templates                          */
/* ══════════════════════════════════════════════════════ */
function TemplatesTab() {
  const [tpl, setTpl]     = useState(() => load('pitstop_template', DEFAULT_TEMPLATE))
  const [saved, setSaved] = useState(false)

  const handleChange = (key, value) => setTpl(prev => ({ ...prev, [key]: value }))

  const handleSave = () => {
    save('pitstop_template', tpl)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Quotation Templates</h2>
          <p className="text-xs text-slate-500 mt-0.5">Company details printed on PDF quotes</p>
        </div>
        <div className="flex items-center gap-3">
          <SavedBadge show={saved} />
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-surface-700 border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-5">
        {/* Company info */}
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Company Info</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">
              <Wrench className="inline w-3 h-3 mr-1" />Company Name
            </label>
            <input
              value={tpl.companyName}
              onChange={e => handleChange('companyName', e.target.value)}
              placeholder="e.g. Pitstop Garage"
              className={FIELD}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">
              <Phone className="inline w-3 h-3 mr-1" />Phone
            </label>
            <input
              value={tpl.companyPhone}
              onChange={e => handleChange('companyPhone', e.target.value)}
              placeholder="+971 4 000 0000"
              className={FIELD}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">
              <Mail className="inline w-3 h-3 mr-1" />Email
            </label>
            <input
              value={tpl.companyEmail}
              onChange={e => handleChange('companyEmail', e.target.value)}
              placeholder="info@yourgarage.ae"
              className={FIELD}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">
              <Clock className="inline w-3 h-3 mr-1" />Default Quote Validity (days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={tpl.defaultValidity}
              onChange={e => handleChange('defaultValidity', Number(e.target.value))}
              className={FIELD}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-white/[0.06]">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-4">Quote Footer</p>
          <label className="text-xs text-slate-400 mb-1.5 block font-medium">Footer Text (printed at bottom of PDF)</label>
          <textarea
            value={tpl.footerText}
            onChange={e => handleChange('footerText', e.target.value)}
            rows={3}
            className={`${FIELD} resize-none`}
            placeholder="e.g. Prices are inclusive of 5% VAT..."
          />
        </div>

        {/* Preview */}
        <div className="pt-2 border-t border-white/[0.06]">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">PDF Header Preview</p>
          <div className="bg-white rounded-xl p-5 text-black font-sans text-sm">
            <div className="flex items-start justify-between pb-4 border-b-2 border-gray-200">
              <div>
                <p className="text-xl font-black text-gray-900">{tpl.companyName || 'Your Garage'}</p>
                <p className="text-gray-500 text-xs mt-0.5">Dubai Auto Services</p>
                <p className="text-gray-500 text-xs">{tpl.companyEmail}</p>
                <p className="text-gray-500 text-xs">{tpl.companyPhone}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-gray-900">QUO-0001</div>
                <div className="text-xs text-gray-400 mt-1">Issued: {new Date().toLocaleDateString()}</div>
                <div className="text-xs text-gray-400 mt-0.5">Valid for {tpl.defaultValidity} days</div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-4">{tpl.footerText}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════ */
/*  Main Settings page                                   */
/* ══════════════════════════════════════════════════════ */
export default function Settings() {
  const [tab, setTab] = useState('staff')

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your garage configuration</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        <Tab active={tab === 'staff'}    onClick={() => setTab('staff')}    icon={Users}    label="Staff" />
        <Tab active={tab === 'catalogue'} onClick={() => setTab('catalogue')} icon={Wrench}   label="Service Catalogue" />
        <Tab active={tab === 'templates'} onClick={() => setTab('templates')} icon={FileText}  label="Quote Templates" />
      </div>

      {/* Tab content */}
      {tab === 'staff'     && <StaffTab />}
      {tab === 'catalogue' && <CatalogueTab />}
      {tab === 'templates' && <TemplatesTab />}
    </div>
  )
}
