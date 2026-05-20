import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Wrench, ChevronDown } from 'lucide-react'

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
    navigate(user.role === 'manager' ? '/manager' : '/receptionist')
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
        <div className="card" style={{ padding: '28px 28px 24px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 22, letterSpacing: '-0.01em' }}>
            Sign in to your workspace
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Role selector */}
            <div>
              <label className="form-label">Select your role</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="form-input"
                  style={{ appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="manager">Manager / Owner</option>
                </select>
                <ChevronDown
                  size={14}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }}
                />
              </div>
            </div>

            {/* Demo user preview */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--pill-bg)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '10px 14px',
            }}>
              <div className="avatar sm">
                {role === 'receptionist' ? 'MA' : 'SM'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  {role === 'receptionist' ? 'Mariam Al-Zaabi' : 'Saeed Al-Mansoori'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                  {role === 'receptionist' ? 'Receptionist — Full job access' : 'Manager — Dashboard & reports'}
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

        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', marginTop: 20 }}>
          Pitstop Garage ERP © 2026 · Dubai, UAE
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
