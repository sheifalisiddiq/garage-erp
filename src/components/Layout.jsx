import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Wrench, LayoutDashboard, PlusCircle, FileText,
  LogOut, ChevronRight, Activity
} from 'lucide-react'

function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
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

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isReceptionist = user?.role === 'receptionist'

  return (
    <div className="flex min-h-screen bg-surface-900">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-surface-800 border-r border-white/[0.05] flex flex-col">
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

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
