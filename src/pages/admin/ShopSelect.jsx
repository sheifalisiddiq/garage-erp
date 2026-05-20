import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Wrench, MapPin, Users, ChevronRight, LogOut, ShieldCheck } from 'lucide-react'

const GARAGES = [
  {
    id: 'pitstop',
    name: 'Pitstop Garage',
    location: 'Al Quoz, Dubai, UAE',
    staff: 8,
    active: true,
    dest: '/manager',
  },
  {
    id: 'speedway',
    name: 'Speedway Auto',
    location: 'Deira, Dubai, UAE',
    staff: 5,
    active: false,
    dest: null,
  },
  {
    id: 'fastlane',
    name: 'Fast Lane Workshop',
    location: 'Sharjah, UAE',
    staff: 6,
    active: false,
    dest: null,
  },
]

export default function ShopSelect() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AR'

  const handleSelect = (garage) => {
    if (garage.active && garage.dest) navigate(garage.dest)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glows */}
      <div style={{
        position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(var(--accent-glow)/0.08), transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '15%',
        width: 350, height: 350, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.05), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 860 }}>
        {/* Brand + user chip */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div className="brand-mark" style={{
            width: 52, height: 52, borderRadius: 16, margin: '0 auto 16px',
            boxShadow: '0 20px 50px -20px rgba(var(--accent-glow)/0.55)',
          }}>
            <Wrench size={22} color="white" strokeWidth={2.2} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1 }}>
            Pit<span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>stop</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 8, marginBottom: 18 }}>
            Select a workspace to continue
          </div>

          {/* Admin badge + user chip */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 999, padding: '6px 14px 6px 8px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(var(--accent-glow)/0.12)',
              border: '1px solid rgba(var(--accent-glow)/0.25)',
              borderRadius: 999, padding: '2px 8px 2px 6px',
              fontSize: 10, fontWeight: 700, color: 'var(--accent-500)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              <ShieldCheck size={10} />
              Admin
            </div>
            <div className="avatar sm" style={{ width: 22, height: 22, fontSize: 9 }}>{initials}</div>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500 }}>{user?.name}</span>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                background: 'transparent', border: 0, padding: '2px 4px', borderRadius: 6,
                color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)' }}
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>

        {/* Garage cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {GARAGES.map((garage) => (
            <GarageCard key={garage.id} garage={garage} onSelect={handleSelect} />
          ))}
        </div>

        <p style={{
          textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', marginTop: 40,
        }}>
          Pitstop Garage ERP © 2026 · Admin Console
        </p>
      </div>
    </div>
  )
}

function GarageCard({ garage, onSelect }) {
  return (
    <button
      onClick={() => onSelect(garage)}
      disabled={!garage.active}
      style={{
        textAlign: 'left',
        background: 'var(--card)',
        border: garage.active
          ? '1px solid rgba(var(--accent-glow)/0.22)'
          : '1px solid var(--border)',
        borderRadius: 20,
        padding: '22px 22px 20px',
        cursor: garage.active ? 'pointer' : 'not-allowed',
        transition: 'all 180ms ease',
        opacity: garage.active ? 1 : 0.42,
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
      }}
      onMouseEnter={e => {
        if (!garage.active) return
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = '0 16px 48px -16px rgba(var(--accent-glow)/0.30)'
        e.currentTarget.style.borderColor = 'rgba(var(--accent-glow)/0.45)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = ''
        e.currentTarget.style.borderColor = garage.active
          ? 'rgba(var(--accent-glow)/0.22)'
          : 'var(--border)'
      }}
    >
      {/* Live badge */}
      {garage.active && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 10, fontWeight: 700, color: 'var(--accent-500)',
          background: 'rgba(var(--accent-glow)/0.12)',
          border: '1px solid rgba(var(--accent-glow)/0.25)',
          borderRadius: 999, padding: '2px 8px',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          <div className="live-dot" style={{ width: 5, height: 5 }} />
          Live
        </div>
      )}

      {!garage.active && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          fontSize: 10, fontWeight: 600, color: 'var(--text-faint)',
          background: 'var(--hover)', border: '1px solid var(--border)',
          borderRadius: 999, padding: '2px 8px',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          Offline
        </div>
      )}

      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 13, marginBottom: 16,
        background: garage.active ? 'rgba(var(--accent-glow)/0.12)' : 'var(--hover)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: garage.active ? 'var(--accent-500)' : 'var(--text-faint)',
      }}>
        <Wrench size={18} strokeWidth={2} />
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 6 }}>
        {garage.name}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>
        <MapPin size={11} />
        {garage.location}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-dim)' }}>
        <Users size={11} />
        {garage.staff} staff members
      </div>

      {garage.active && (
        <div style={{
          position: 'absolute', bottom: 20, right: 20,
          color: 'var(--accent-500)',
          transition: 'transform 150ms ease',
        }}>
          <ChevronRight size={16} />
        </div>
      )}
    </button>
  )
}
