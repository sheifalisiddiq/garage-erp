import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Wrench, LayoutDashboard, PlusCircle, FileText,
  LogOut, Activity, Menu, X
} from 'lucide-react'

function NavItem({ to, icon: Icon, label, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
        ${isActive
          ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
          : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
        }`
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </NavLink>
  )
}

function BottomNavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 flex-1
        ${isActive
          ? 'text-brand-400'
          : 'text-slate-500'
        }`
      }
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </NavLink>
  )
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isReceptionist = user?.role === 'receptionist'

  const navItems = isReceptionist ? [
    { to: '/receptionist', end: true, icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/receptionist/new-job', icon: PlusCircle, label: 'New Job' },
    { to: '/receptionist/invoices', icon: FileText, label: 'Invoices' },
  ] : [
    { to: '/manager', end: true, icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/manager/jobs', icon: Activity, label: 'All Jobs' },
  ]

  return (
    <div className="flex min-h-screen bg-surface-900">
      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-shrink-0 bg-surface-800 border-r border-white/[0.05] flex-col">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Garage ERP</p>
              <p className="text-xs text-slate-500 mt-0.5">Dubai Auto Services</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {isReceptionist ? (
            <>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">Jobs</p>
              <NavItem to="/receptionist" end icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/receptionist/new-job" icon={PlusCircle} label="New Job" />
              <NavItem to="/receptionist/invoices" icon={FileText} label="Invoices" />
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">Analytics</p>
              <NavItem to="/manager" end icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/manager/jobs" icon={Activity} label="All Jobs" />
            </>
          )}
        </nav>

        {/* User profile */}
        <div className="px-3 pb-4 border-t border-white/[0.05] pt-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-700">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile: top bar + slide-in drawer ────────────── */}
      {/* Top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-surface-800 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-sm font-bold text-white">Garage ERP</p>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-surface-800 border-r border-white/[0.05] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Garage ERP</p>
              <p className="text-xs text-slate-500 mt-0.5">Dubai Auto Services</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {isReceptionist ? (
            <>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">Jobs</p>
              <NavItem to="/receptionist" end icon={LayoutDashboard} label="Dashboard" onClick={() => setSidebarOpen(false)} />
              <NavItem to="/receptionist/new-job" icon={PlusCircle} label="New Job" onClick={() => setSidebarOpen(false)} />
              <NavItem to="/receptionist/invoices" icon={FileText} label="Invoices" onClick={() => setSidebarOpen(false)} />
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">Analytics</p>
              <NavItem to="/manager" end icon={LayoutDashboard} label="Dashboard" onClick={() => setSidebarOpen(false)} />
              <NavItem to="/manager/jobs" icon={Activity} label="All Jobs" onClick={() => setSidebarOpen(false)} />
            </>
          )}
        </nav>

        <div className="px-3 pb-4 border-t border-white/[0.05] pt-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-700">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────── */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14 pb-16 md:pb-0">
        {children}
      </main>

      {/* ── Mobile bottom nav ─────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center bg-surface-800 border-t border-white/[0.05] px-2 py-1 safe-area-inset-bottom">
        {navItems.map(item => (
          <BottomNavItem key={item.to} {...item} />
        ))}
      </nav>
    </div>
  )
}
