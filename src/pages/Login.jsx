import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Wrench, ChevronDown, Check, User } from 'lucide-react'

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
  receptionist: 'Receptionist — Jobs, inventory & settings',
  manager:      'Manager — Read-only analytics',
  admin:        'Admin — Multi-garage management',
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
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '13px 16px',
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${open ? 'rgba(var(--accent-glow)/0.5)' : 'rgba(255,255,255,0.10)'}`,
          borderRadius: 12,
          cursor: 'pointer',
          textAlign: 'left',
          boxShadow: open ? '0 0 0 3px rgba(var(--accent-glow)/0.12)' : 'none',
          transition: 'border-color 160ms ease, box-shadow 160ms ease',
        }}
      >
        <User size={16} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: 'inherit' }}>
          {selected?.label}
        </span>
        <ChevronDown
          size={15}
          style={{
            color: 'rgba(255,255,255,0.35)',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 160ms ease',
          }}
        />
      </button>

      {/* Always rendered — CSS opacity/transform gives exit animation */}
      <div style={{
        position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
        background: '#1c1c2e',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12,
        boxShadow: '0 20px 48px -12px rgba(0,0,0,0.8)',
        overflow: 'hidden',
        zIndex: 50,
        opacity: open ? 1 : 0,
        transform: open ? 'none' : 'translateY(-4px) scale(0.95)',
        pointerEvents: open ? 'auto' : 'none',
        visibility: open ? 'visible' : 'hidden',
        transition: 'opacity 150ms cubic-bezier(0.23,1,0.32,1), transform 150ms cubic-bezier(0.23,1,0.32,1), visibility 0s linear ' + (open ? '0s' : '150ms'),
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
              background: r.value === value ? 'rgba(var(--accent-glow)/0.10)' : 'transparent',
              border: 0, cursor: 'pointer',
              color: r.value === value ? 'var(--accent-400)' : 'rgba(255,255,255,0.75)',
              fontSize: 13.5, fontFamily: 'inherit',
              transition: 'background 120ms cubic-bezier(0.23,1,0.32,1), transform 80ms cubic-bezier(0.23,1,0.32,1)',
            }}
            onMouseEnter={e => { if (r.value !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { if (r.value !== value) e.currentTarget.style.background = 'transparent' }}
          >
            {r.label}
            {r.value === value && <Check size={13} style={{ flexShrink: 0, color: 'var(--accent-400)' }} />}
          </button>
        ))}
      </div>
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
      background: '#0a0a12',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Purple glow — right side, like the reference */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '55vw',
        height: '70vh',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, rgba(120,60,220,0.28) 0%, rgba(80,30,180,0.14) 40%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(40px)',
      }} />
      {/* Subtle bottom-left dark shadow to balance */}
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        left: '-10%',
        width: '40vw',
        height: '50vh',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, rgba(40,20,80,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(60px)',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo above card */}
        <div className="animate-fade-up stagger-1" style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 0 24px rgba(var(--accent-glow)/0.4)',
            }}>
              <Wrench size={18} color="white" strokeWidth={2.5} />
            </div>
            <span style={{
              fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em',
              color: '#ffffff', fontFamily: 'inherit',
            }}>
              Pit<span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>stop</span>
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="animate-fade-up stagger-2" style={{
          background: 'rgba(18,18,30,0.85)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 20,
          padding: '36px 32px 32px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 32px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset',
        }}>

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              lineHeight: 1.1,
            }}>
              Log in
            </h1>
            <p style={{
              margin: '10px 0 0',
              fontSize: 13.5,
              color: 'rgba(255,255,255,0.42)',
              lineHeight: 1.4,
            }}>
              Welcome back {DEMO_NAMES[role].split(' ')[0]}, please login
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Role selector */}
            <div>
              <RoleDropdown value={role} onChange={setRole} />
            </div>

            {/* Demo user preview */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '11px 14px',
            }}>
              <div className="avatar sm">
                {DEMO_INITIALS[role]}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                  {DEMO_NAMES[role]}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                  {DEMO_DESC[role]}
                </div>
              </div>
            </div>

            {/* Demo badge row — styled like remember/forgot row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12.5,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.4)' }}>
                <div className="live-dot" />
                Demo mode
              </div>
              <span style={{ color: 'var(--accent-400)', fontWeight: 500, cursor: 'default' }}>
                No password required
              </span>
            </div>

            {/* Submit button — uses btn-primary class for CSS :active press feedback */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px 20px',
                marginTop: 6,
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                boxShadow: loading ? 'none' : undefined,
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 15, height: 15,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Signing in...
                </>
              ) : 'Continue'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="animate-fade-up stagger-3" style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 22 }}>
          Pitstop Garage ERP ·{' '}
          <span style={{ color: 'var(--accent-400)', cursor: 'default' }}>Dubai Auto Services</span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
