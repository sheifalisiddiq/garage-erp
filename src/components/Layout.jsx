import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Wrench, LayoutDashboard, PlusCircle, FileText,
  LogOut, Activity, ClipboardList,
  Bell, Settings, Sun, Moon,
  Mic, Menu, X,
  Boxes, ShieldCheck
} from 'lucide-react'

/* ── Nav configuration ───────────────────────────────── */
const MANAGER_NAV_MAIN = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/manager', end: true },
  { id: 'jobs',      label: 'Jobs',      icon: Activity,        to: '/manager/jobs' },
  { id: 'inventory', label: 'Inventory', icon: Boxes,           to: '/manager/inventory' },
  { id: 'quotes',    label: 'Quotations',icon: ClipboardList,   to: '/manager/quotes' },
]

const RECEPTIONIST_NAV_MAIN = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard, to: '/receptionist',           end: true },
  { id: 'new-job',   label: 'New Job',    icon: PlusCircle,      to: '/receptionist/new-job'          },
  { id: 'inventory', label: 'Inventory',  icon: Boxes,           to: '/receptionist/inventory'        },
  { id: 'quotes',    label: 'Quotations', icon: ClipboardList,   to: '/receptionist/quotes'           },
  { id: 'invoices',  label: 'Invoices',   icon: FileText,        to: '/receptionist/invoices'         },
  { id: 'settings',  label: 'Settings',   icon: Settings,        to: '/receptionist/settings'         },
]

/* ── Sidebar nav item ─────────────────────────────────── */
function NavItem({ item, onClick }) {
  const Icon = item.icon
  if (!item.to) {
    return (
      <button className="nav-item" onClick={onClick}>
        <Icon className="nav-icon" size={18} strokeWidth={1.8} />
        <span>{item.label}</span>
        {item.badge != null && <span className="nav-badge">{item.badge}</span>}
      </button>
    )
  }
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) => 'nav-item' + (isActive ? ' is-active' : '')}
    >
      <Icon className="nav-icon" size={18} strokeWidth={1.8} />
      <span>{item.label}</span>
      {item.badge != null && <span className="nav-badge">{item.badge}</span>}
    </NavLink>
  )
}

/* ── Sidebar content ─────────────────────────────────── */
function SidebarContent({ user, onNavClick, onLogout }) {
  const isReceptionist = user?.role === 'receptionist'
  const navMain   = isReceptionist ? RECEPTIONIST_NAV_MAIN : MANAGER_NAV_MAIN
  const firstName = user?.name?.split(' ')[0] || 'there'
  const initials   = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const dayName    = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const dateFmt    = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return (
    <>
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark">
          <Wrench size={16} color="white" strokeWidth={2.2} />
        </div>
        <span>Pit<span className="brand-vest">stop</span></span>
      </div>

      {/* Welcome */}
      <div className="welcome">
        <div className="welcome-hi">Welcome, <strong>{firstName}</strong></div>
        <div className="welcome-sub">
          {dayName} at the garage —<br />
          {isReceptionist ? 'Front desk' : user?.role === 'admin' ? 'Admin view' : 'Manager view'} · {dateFmt}
        </div>
      </div>

      {/* Main nav */}
      <div className="nav-section">
        <div className="nav-section-title">Main Menu</div>
        {navMain.map(item => (
          <NavItem key={item.id} item={item} onClick={onNavClick} />
        ))}
      </div>

      {/* User chip at bottom */}
      <div className="side-foot">
        <div className="avatar sm">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="profile-name" style={{ fontSize: 12 }}>{user?.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div className="profile-role" style={{ textTransform: 'capitalize' }}>{user?.role}</div>
            {user?.role === 'admin' && (
              <ShieldCheck size={10} style={{ color: 'var(--accent-500)', flexShrink: 0 }} />
            )}
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Logout"
          style={{
            background: 'transparent', border: 0, padding: '6px 8px', borderRadius: 8,
            color: 'var(--text-dim)', cursor: 'pointer', transition: 'all 160ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.10)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </>
  )
}

/* ── Top bar ─────────────────────────────────────────── */
const TOP_TABS = ['Workshop', 'Customers', 'Tools']

function TopBar({ theme, toggleTheme, onMenuOpen }) {
  const location = useLocation()
  const activeTab = location.pathname.includes('customer') ? 'Customers'
    : location.pathname.includes('inventor') || location.pathname.includes('tools') ? 'Tools'
    : 'Workshop'

  return (
    <header className="topbar">
      {/* Mobile hamburger */}
      <button
        className="icon-btn"
        style={{ display: 'none' }}
        onClick={onMenuOpen}
        aria-label="Open menu"
        id="mobile-menu-btn"
      >
        <Menu size={16} />
      </button>

      {/* Pill tabs */}
      <div className="pill-group">
        {TOP_TABS.map(tab => (
          <button
            key={tab}
            className={'pill' + (activeTab === tab ? ' is-active' : '')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="searchbar">
        <Mic size={16} />
        <input placeholder="Search jobs, vehicles, customers…" />
        <kbd>⌘K</kbd>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="icon-btn" title="Notifications">
          <Bell size={16} />
          <span className="dot" />
        </button>
      </div>
    </header>
  )
}

/* ── Layout shell ─────────────────────────────────────── */
export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => localStorage.getItem('pitstop-theme') || 'dark')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-accent', 'crimson')
    document.documentElement.setAttribute('data-density', 'comfortable')
    localStorage.setItem('pitstop-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidebarProps = { user, onNavClick: () => setDrawerOpen(false), onLogout: handleLogout }

  return (
    <div className="app">

      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="sidebar sidebar-desktop">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile overlay ──────────────────────────────── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 49,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease both',
          }}
        />
      )}

      {/* ── Mobile drawer ───────────────────────────────── */}
      <aside
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
          width: 260,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 280ms cubic-bezier(0.16,1,0.3,1)',
          display: 'flex', flexDirection: 'column',
        }}
        className="sidebar"
      >
        <button
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 1,
            background: 'var(--pill-bg)', border: '1px solid var(--border)',
            borderRadius: 999, width: 32, height: 32,
            display: 'grid', placeItems: 'center', color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={14} />
        </button>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Main shell ──────────────────────────────────── */}
      <div className="shell">
        <TopBar theme={theme} toggleTheme={toggleTheme} onMenuOpen={() => setDrawerOpen(true)} />
        <main className="page">
          {children}
        </main>
      </div>

      {/* ── Mobile show-menu button (injected via CSS) ─── */}
      <style>{`
        @media (max-width: 880px) {
          #mobile-menu-btn { display: grid !important; }
          .pill-group { display: none !important; }
          .searchbar { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}
