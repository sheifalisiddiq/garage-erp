import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Wrench, ChevronDown, Check } from 'lucide-react'

const ROLES = [
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'manager',      label: 'Manager / Owner' },
  { value: 'admin',        label: 'Admin (Multi-garage)' },
]

const DEMO_NAMES = {
  receptionist: 'Mariam Al-Zaabi',
  manager:      'Saeed Al-Mansoori',
  admin:        'Ahmad Al-Rashid',
}

const DEMO_DESC = {
  receptionist: 'Front desk — Jobs, invoices, quotations',
  manager:      'Manager view — Analytics and oversight',
  admin:        'Admin — Multi-location management',
}

const DEMO_INITIALS = {
  receptionist: 'MA',
  manager:      'SM',
  admin:        'AR',
}

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
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 14px',
          background: 'rgba(10,20,35,0.90)',
          border: `1px solid ${open ? 'rgba(0,212,169,0.35)' : 'rgba(0,212,169,0.15)'}`,
          borderRadius: 10,
          cursor: 'pointer', textAlign: 'left',
          boxShadow: open ? '0 0 0 3px rgba(0,212,169,0.10)' : 'none',
          transition: 'border-color 140ms ease, box-shadow 140ms ease',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ flex: 1, fontSize: 13.5, color: '#e8f0f8', fontWeight: 500 }}>
          {selected?.label}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: '#6b7f96', flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 140ms ease',
          }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0,
          background: 'rgba(8,15,28,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(0,212,169,0.15)',
          borderRadius: 10,
          boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,169,0.08)',
          overflow: 'hidden', zIndex: 50,
          animation: 'dropdownIn 0.14s cubic-bezier(0.16,1,0.3,1) both',
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
                background: r.value === value ? 'rgba(0,212,169,0.12)' : 'transparent',
                border: 0, cursor: 'pointer',
                color: r.value === value ? '#00d4a9' : '#e8f0f8',
                fontSize: 13.5, fontFamily: 'inherit',
                fontWeight: r.value === value ? 600 : 400,
                transition: 'background 120ms ease',
              }}
              onMouseEnter={e => { if (r.value !== value) e.currentTarget.style.background = 'rgba(0,212,169,0.06)' }}
              onMouseLeave={e => { if (r.value !== value) e.currentTarget.style.background = 'transparent' }}
            >
              {r.label}
              {r.value === value && <Check size={13} style={{ flexShrink: 0, color: '#00d4a9' }} />}
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
    await new Promise(r => setTimeout(r, 500))
    const user = login(role)
    navigate(user.role === 'admin' ? '/admin' : user.role === 'manager' ? '/manager' : '/receptionist')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#04080f',
      backgroundImage: [
        'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,212,169,0.09) 0%, transparent 65%)',
        'radial-gradient(ellipse 40% 40% at 85% 110%, rgba(0,80,200,0.05) 0%, transparent 60%)',
      ].join(', '),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 32 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'linear-gradient(135deg, #00d4a9, #00b890)',
            display: 'grid', placeItems: 'center',
            boxShadow: '0 4px 16px rgba(0,212,169,0.35)',
          }}>
            <Wrench size={16} color="white" strokeWidth={2.2} />
          </div>
          <span style={{
            fontSize: 20, fontWeight: 700, letterSpacing: '-0.025em',
            color: '#e8f0f8',
          }}>
            Pit<span style={{ color: '#3d5168', fontWeight: 500 }}>stop</span>
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(10,20,35,0.85)',
          backdropFilter: 'blur(40px) saturate(150%)',
          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
          border: '1px solid rgba(0,212,169,0.12)',
          borderRadius: 20,
          padding: '32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>

          <div style={{ marginBottom: 24 }}>
            <h1 style={{
              margin: 0, fontSize: 24, fontWeight: 700,
              letterSpacing: '-0.025em', color: '#e8f0f8', lineHeight: 1.2,
            }}>
              Sign in
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#6b7f96', lineHeight: 1.5 }}>
              Select a role to explore the demo
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 600,
                color: '#6b7f96', marginBottom: 6,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Role
              </label>
              <RoleDropdown value={role} onChange={setRole} />
            </div>

            {/* User preview */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 11,
              background: 'rgba(0,212,169,0.06)',
              border: '1px solid rgba(0,212,169,0.12)',
              borderRadius: 10, padding: '11px 14px',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 999, flexShrink: 0,
                background: 'linear-gradient(135deg, #00d4a9, #00b890)',
                display: 'grid', placeItems: 'center',
                color: 'white', fontWeight: 700, fontSize: 12,
                boxShadow: '0 4px 12px rgba(0,212,169,0.30)',
              }}>
                {DEMO_INITIALS[role]}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#e8f0f8' }}>
                  {DEMO_NAMES[role]}
                </div>
                <div style={{ fontSize: 11.5, color: '#6b7f96', marginTop: 2 }}>
                  {DEMO_DESC[role]}
                </div>
              </div>
            </div>

            {/* Demo notice */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 12, color: '#3d5168',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 5, height: 5, borderRadius: 999,
                  background: '#34d399', flexShrink: 0, display: 'inline-block',
                  boxShadow: '0 0 6px rgba(52,211,153,0.6)',
                }} />
                Demo mode active
              </span>
              <span style={{ color: '#00d4a9' }}>No password required</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px 20px', marginTop: 4,
                border: 0, borderRadius: 10,
                background: loading
                  ? 'rgba(0,212,169,0.40)'
                  : 'linear-gradient(135deg, #00d4a9 0%, #00b890 100%)',
                color: 'white', fontSize: 14, fontWeight: 700,
                fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity 140ms ease, transform 140ms ease, box-shadow 140ms ease',
                letterSpacing: '-0.01em',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(0,212,169,0.30)',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,212,169,0.40)'; } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,212,169,0.30)'; } }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 14, height: 14,
                    border: '2px solid rgba(255,255,255,0.35)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.65s linear infinite',
                  }} />
                  Signing in
                </>
              ) : 'Continue'}
            </button>

          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12.5, color: '#243040', marginTop: 20 }}>
          Pitstop ERP · Dubai Auto Services
        </p>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-5px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
