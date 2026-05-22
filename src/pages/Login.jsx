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
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: `1px solid ${open ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
          borderRadius: 14,
          cursor: 'pointer', textAlign: 'left',
          boxShadow: open ? '0 0 0 3px rgba(255, 255, 255, 0.05)' : 'none',
          transition: 'border-color 140ms ease, box-shadow 140ms ease, background 140ms ease',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ flex: 1, fontSize: 13.5, color: '#ffffff', fontWeight: 500 }}>
          {selected?.label}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: '#a1a1aa', flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 140ms ease',
          }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0,
          background: 'rgba(20, 20, 22, 0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 14,
          boxShadow: '0 16px 48px rgba(0,0,0,0.85), 0 0 0 1px rgba(255, 255, 255, 0.04)',
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
                gap: 10, padding: '11px 16px',
                background: r.value === value ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                border: 0, cursor: 'pointer',
                color: r.value === value ? '#ffffff' : '#a1a1aa',
                fontSize: 13.5, fontFamily: 'inherit',
                fontWeight: r.value === value ? 600 : 400,
                transition: 'background 120ms ease, color 120ms ease',
              }}
              onMouseEnter={e => { if (r.value !== value) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; e.currentTarget.style.color = '#ffffff'; } }}
              onMouseLeave={e => { if (r.value !== value) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; } }}
            >
              {r.label}
              {r.value === value && <Check size={13} style={{ flexShrink: 0, color: '#ffffff' }} />}
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
      background: '#000000',
      backgroundImage: [
        'radial-gradient(circle at 75% 15%, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 40%, transparent 75%)',
        'radial-gradient(circle at 100% 0%, rgba(255, 255, 255, 0.12) 0%, transparent 50%)',
      ].join(', '),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Card */}
        <div style={{
          background: 'rgba(18, 18, 20, 0.4)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 36,
          padding: '36px 32px',
          boxShadow: '0 32px 64px -16px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>

          {/* Logo inside card */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 999,
              background: 'linear-gradient(135deg, #ffffff 0%, #e4e4e7 100%)',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 8px 24px rgba(255,255,255,0.1)',
            }}>
              <Wrench size={18} color="#000000" strokeWidth={2.2} />
            </div>
            <span style={{
              fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em',
              color: '#ffffff',
            }}>
              Pit<span style={{ color: '#a1a1aa', fontWeight: 500 }}>stop</span>
            </span>
          </div>

          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <h1 style={{
              margin: 0, fontSize: 24, fontWeight: 700,
              letterSpacing: '-0.025em', color: '#ffffff', lineHeight: 1.2,
            }}>
              Sign In
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#a1a1aa', lineHeight: 1.5 }}>
              Please enter your details to sign in.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 600,
                color: '#71717a', marginBottom: 6,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Role
              </label>
              <RoleDropdown value={role} onChange={setRole} />
            </div>

            {/* User preview */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 11,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 14, padding: '12px 14px',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 999, flexShrink: 0,
                background: 'linear-gradient(135deg, #ffffff 0%, #e4e4e7 100%)',
                display: 'grid', placeItems: 'center',
                color: '#000000', fontWeight: 700, fontSize: 12,
                boxShadow: '0 4px 12px rgba(255,255,255,0.1)',
              }}>
                {DEMO_INITIALS[role]}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#ffffff' }}>
                  {DEMO_NAMES[role]}
                </div>
                <div style={{ fontSize: 11.5, color: '#a1a1aa', marginTop: 2 }}>
                  {DEMO_DESC[role]}
                </div>
              </div>
            </div>

            {/* Demo notice */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 12, color: '#52525b',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 5, height: 5, borderRadius: 999,
                  background: '#a1a1aa', flexShrink: 0, display: 'inline-block',
                  boxShadow: '0 0 6px rgba(255,255,255,0.4)',
                }} />
                Demo mode active
              </span>
              <span style={{ color: '#a1a1aa' }}>No password required</span>
            </div>

            {/* Submit button: white rounded pill */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px 20px', marginTop: 12,
                border: 0, borderRadius: 999,
                background: loading ? 'rgba(255, 255, 255, 0.6)' : '#ffffff',
                color: '#000000', fontSize: 14, fontWeight: 700,
                fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity 140ms ease, transform 140ms ease, background 140ms ease',
                letterSpacing: '-0.01em',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(255,255,255,0.05)',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; } }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 14, height: 14,
                    border: '2px solid rgba(0,0,0,0.2)',
                    borderTopColor: '#000000',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.65s linear infinite',
                  }} />
                  Signing in
                </>
              ) : 'Sign in'}
            </button>

          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12.5, color: '#3f3f46', marginTop: 24 }}>
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
