import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Wrench, ChevronDown, Check } from 'lucide-react'

const ROLES = [
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'manager',      label: 'Manager / Owner' },
  { value: 'admin',        label: 'Admin (Multi-garage)' },
]

function RoleDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = ROLES.find(r => r.value === value)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="form-input"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', textAlign: 'left',
          borderColor: open ? 'var(--accent-500)' : undefined,
          boxShadow: open ? '0 0 0 3px rgba(var(--accent-glow)/0.15)' : undefined,
        }}
      >
        <span style={{ color: 'var(--text)' }}>{selected?.label}</span>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-dim)', flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 160ms ease',
          }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--card-elev)',
          border: '1px solid var(--border-strong)',
          borderRadius: 12,
          boxShadow: '0 16px 40px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset',
          overflow: 'hidden',
          zIndex: 50,
          animation: 'dropdownIn 0.15s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          {ROLES.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => { onChange(r.value); setOpen(false) }}
              style={{
                width: '100%', textAlign: 'left',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 10, padding: '10px 14px',
                background: r.value === value ? 'rgba(var(--accent-glow)/0.12)' : 'transparent',
                border: 0, cursor: 'pointer',
                color: r.value === value ? 'var(--accent-400)' : 'var(--text)',
                fontSize: 13.5, fontFamily: 'inherit',
                transition: 'background 120ms ease',
              }}
              onMouseEnter={e => { if (r.value !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (r.value !== value) e.currentTarget.style.background = 'transparent' }}
            >
              {r.label}
              {r.value === value && <Check size={13} style={{ flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('receptionist')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const user = login(role)
    navigate(user.role === 'admin' ? '/admin' : user.role === 'manager' ? '/manager' : '/receptionist')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(var(--accent-glow)/0.10), transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '20%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.06), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div className="brand-mark" style={{
            width: 56, height: 56, borderRadius: 18,
            margin: '0 auto 16px',
            boxShadow: '0 20px 50px -20px rgba(var(--accent-glow)/0.6)',
          }}>
            <Wrench size={24} color="white" strokeWidth={2.2} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1 }}>
            Pit<span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>stop</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 8 }}>
            Garage ERP · Dubai Auto Services
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{
          padding: '28px 28px 24px',
          background: 'var(--hero-grad)',
        }}>
          {/* Noise texture */}
          <div style={{ position: 'absolute', inset: 0, background: 'var(--hero-noise)', opacity: 0.6, mixBlendMode: 'overlay', pointerEvents: 'none', borderRadius: 'inherit', zIndex: 0 }} />
          {/* Bottom vignette */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to bottom, transparent, rgba(5,7,14,0.85))', pointerEvents: 'none', zIndex: 0 }} />
          {/* Accent glow */}
          <div style={{ position: 'absolute', right: -40, bottom: -50, width: 220, height: 180, background: 'radial-gradient(closest-side, rgba(var(--accent-glow)/0.16), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 22, letterSpacing: '-0.01em' }}>
              Sign in to your workspace
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Role selector */}
              <div>
                <label className="form-label">Select your role</label>
                <RoleDropdown value={role} onChange={setRole} />
              </div>

              {/* Demo user preview */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 12, padding: '10px 14px',
              }}>
                <div className="avatar sm">
                  {role === 'receptionist' ? 'MA' : role === 'manager' ? 'SM' : 'AR'}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    {role === 'receptionist' ? 'Mariam Al-Zaabi' : role === 'manager' ? 'Saeed Al-Mansoori' : 'Ahmad Al-Rashid'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                    {role === 'receptionist' ? 'Receptionist — Jobs, inventory & settings' : role === 'manager' ? 'Manager — Read-only analytics' : 'Admin — Multi-garage management'}
                  </div>
                </div>
              </div>

              {/* Demo badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--warn)' }}>
                <div className="live-dot" />
                Demo mode — no password required
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '12px 20px', marginTop: 4 }}>
                {loading ? (
                  <>
                    <span style={{
                      width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white', borderRadius: '50%',
                      display: 'inline-block', animation: 'spin 0.7s linear infinite',
                    }} />
                    Signing in...
                  </>
                ) : 'Enter Dashboard'}
              </button>
            </form>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', marginTop: 20 }}>
          Pitstop Garage ERP © 2026 · Dubai, UAE
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes dropdownIn { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  )
}
