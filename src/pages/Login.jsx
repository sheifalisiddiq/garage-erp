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
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-gold-500 opacity-5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 mb-4 shadow-lg shadow-brand-600/30">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Garage ERP</h1>
          <p className="text-slate-400 text-sm mt-1">Dubai Auto Services Management</p>
        </div>

        {/* Card */}
        <div className="bg-surface-700 border border-white/[0.06] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your workspace</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select your role
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full appearance-none bg-surface-600 border border-white/[0.08] text-white rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition cursor-pointer"
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="manager">Manager / Owner</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Demo user preview */}
            <div className="flex items-center gap-3 bg-surface-600 rounded-xl px-4 py-3 border border-white/[0.04]">
              <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {role === 'receptionist' ? 'MA' : 'SM'}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {role === 'receptionist' ? 'Mariam Al-Zaabi' : 'Saeed Al-Mansoori'}
                </p>
                <p className="text-xs text-slate-400">
                  {role === 'receptionist' ? 'Receptionist — Full job access' : 'Manager — Dashboard & reports'}
                </p>
              </div>
            </div>

            {/* Demo badge */}
            <div className="flex items-center gap-2 text-xs text-gold-500">
              <div className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
              Demo mode — no password required
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-brand-600/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Enter Dashboard'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Garage ERP © 2026 · Dubai, UAE
        </p>
      </div>
    </div>
  )
}
