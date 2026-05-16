import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Wrench, LayoutDashboard, PlusCircle, FileText,
  LogOut, Activity, Menu, X, ChevronRight,
  Package, ClipboardList
} from 'lucide-react'

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 px-3 mb-1 mt-5 first:mt-1">
      <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-[0.09em]">{children}</span>
      <div className="flex-1 h-px bg-white/[0.04]" />
    </div>
  )
}

function NavItem({ to, icon: Icon, label, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium
         transition-colors duration-150 group
         ${isActive
           ? 'bg-brand-500/10 text-brand-400'
           : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
         }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-[18px] bg-brand-500 rounded-r-full" />
          )}
          <Icon
            className={`w-4 h-4 flex-shrink-0 transition-colors duration-150
              ${isActive ? 'text-brand-400' : 'text-slate-600 group-hover:text-slate-400'}`}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <span className="flex-1">{label}</span>
          {isActive && <ChevronRight className="w-3 h-3 text-brand-500/50" />}
        </>
      )}
    </NavLink>
  )
}

function BottomNavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-[11px] font-medium
         transition-all duration-150 flex-1
         ${isActive ? 'text-brand-400' : 'text-slate-600'}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}

function SidebarContent({ onNavClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isReceptionist = user?.role === 'receptionist'
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Brand */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/25 flex-shrink-0">
            <Wrench className="w-[15px] h-[15px] text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-none tracking-tight">Garage ERP</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Dubai Auto Services</p>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-white/[0.05]" />

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto scrollbar-none">
        {isReceptionist ? (
          <>
            <SectionLabel>Jobs</SectionLabel>
            <NavItem to="/receptionist" end icon={LayoutDashboard} label="Dashboard" onClick={onNavClick} />
            <NavItem to="/receptionist/new-job" icon={PlusCircle} label="New Job" onClick={onNavClick} />
            <NavItem to="/receptionist/invoices" icon={FileText} label="Invoices" onClick={onNavClick} />
            <SectionLabel>Quotes</SectionLabel>
            <NavItem to="/receptionist/quotes" icon={ClipboardList} label="Quotations" onClick={onNavClick} />
          </>
        ) : (
          <>
            <SectionLabel>Analytics</SectionLabel>
            <NavItem to="/manager" end icon={LayoutDashboard} label="Dashboard" onClick={onNavClick} />
            <NavItem to="/manager/jobs" icon={Activity} label="All Jobs" onClick={onNavClick} />
            <SectionLabel>Operations</SectionLabel>
            <NavItem to="/manager/inventory" icon={Package} label="Inventory" onClick={onNavClick} />
            <NavItem to="/manager/quotes" icon={ClipboardList} label="Quotations" onClick={onNavClick} />
          </>
        )}
      </nav>

      {/* User profile */}
      <div className="mx-4 h-px bg-white/[0.05]" />
      <div className="p-3">
        <div className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white/[0.04] transition-colors duration-150">
          <div className="relative flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-brand-600/20">
              {initials}
            </div>
            <span className="absolute -bottom-px -right-px w-2 h-2 bg-emerald-500 border border-surface-800 rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-slate-200 truncate leading-none">{user?.name}</p>
            <p className="text-[10px] text-slate-600 capitalize mt-[3px]">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-700 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150 p-1.5 rounded-lg"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  )
}

export default function Layout({ children }) {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isReceptionist = user?.role === 'receptionist'
  const navItems = isReceptionist ? [
    { to: '/receptionist', end: true, icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/receptionist/new-job', icon: PlusCircle, label: 'New Job' },
    { to: '/receptionist/quotes', icon: ClipboardList, label: 'Quotes' },
    { to: '/receptionist/invoices', icon: FileText, label: 'Invoices' },
  ] : [
    { to: '/manager', end: true, icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/manager/jobs', icon: Activity, label: 'All Jobs' },
    { to: '/manager/inventory', icon: Package, label: 'Inventory' },
    { to: '/manager/quotes', icon: ClipboardList, label: 'Quotes' },
  ]

  return (
    <div className="flex min-h-screen bg-surface-900">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[220px] flex-shrink-0 flex-col bg-surface-800 border-r border-white/[0.05] shadow-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-surface-800/95 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md shadow-brand-600/30">
            <Wrench className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <p className="text-[13px] font-bold text-white tracking-tight">Garage ERP</p>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors duration-150"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`
        md:hidden fixed top-0 left-0 bottom-0 z-50 w-[260px]
        bg-surface-800 border-r border-white/[0.05] flex flex-col
        transition-transform duration-300 ease-spring
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Wrench className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white leading-none tracking-tight">Garage ERP</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Dubai Auto Services</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-600 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <SidebarContent onNavClick={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14 pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center bg-surface-800/95 backdrop-blur-xl border-t border-white/[0.05] px-2 py-1.5 safe-area-inset-bottom">
        {navItems.map(item => (
          <BottomNavItem key={item.to} {...item} />
        ))}
      </nav>
    </div>
  )
}
