import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSearch } from '../context/SearchContext'
import { supabase } from '../lib/supabase'
import {
  Wrench, LayoutDashboard, PlusCircle, FileText,
  LogOut, Activity, ClipboardList,
  Bell, Settings, Sun, Moon,
  Search, Menu, X,
  Boxes, ShieldCheck, Package, Clock, CheckCircle2
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

/* ── Notification panel ──────────────────────────────── */
function NotificationPanel({ onClose }) {
  const [lowStock, setLowStock] = useState([])
  const [overdueJobs, setOverdueJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const panelRef = useRef(null)

  useEffect(() => {
    const fetchNotifs = async () => {
      setLoading(true)
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

      const [stockRes, jobsRes] = await Promise.all([
        supabase.from('parts').select('name, quantity, min_quantity').not('min_quantity', 'is', null),
        supabase.from('jobs')
          .select('job_number, created_at, customers(name)')
          .eq('status', 'open')
          .lt('created_at', threeDaysAgo)
          .order('created_at', { ascending: true })
          .limit(10),
      ])

      const lowItems = (stockRes.data || []).filter(p => p.quantity <= p.min_quantity)
      setLowStock(lowItems)
      setOverdueJobs(jobsRes.data || [])
      setLoading(false)
    }
    fetchNotifs()
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const total = lowStock.length + overdueJobs.length

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 200,
        width: 320, maxHeight: 420, overflowY: 'auto',
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        padding: '12px 0',
      }}
    >
      <div style={{ padding: '0 16px 8px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Notifications</span>
        {total > 0 && (
          <span style={{
            marginLeft: 8, fontSize: 11, background: 'var(--destructive)', color: '#fff',
            borderRadius: 999, padding: '1px 7px',
          }}>{total}</span>
        )}
      </div>

      {loading && (
        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
          Loading…
        </div>
      )}

      {!loading && total === 0 && (
        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
          <CheckCircle2 size={24} style={{ color: 'var(--text-dim)', margin: '0 auto 8px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>All clear</div>
        </div>
      )}

      {!loading && lowStock.length > 0 && (
        <>
          <div style={{ padding: '4px 16px 6px', fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Low Stock
          </div>
          {lowStock.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' }}>
              <Package size={14} style={{ color: '#f87171', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, truncate: true }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Qty: {p.quantity} / min {p.min_quantity}</div>
              </div>
              <span style={{ fontSize: 10, background: 'rgba(248,113,113,0.15)', color: '#f87171', borderRadius: 999, padding: '2px 8px' }}>
                Low
              </span>
            </div>
          ))}
        </>
      )}

      {!loading && overdueJobs.length > 0 && (
        <>
          <div style={{ padding: '8px 16px 6px', fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: lowStock.length ? '1px solid var(--border)' : undefined, marginTop: lowStock.length ? 4 : 0 }}>
            Open &gt; 3 Days
          </div>
          {overdueJobs.map((j, i) => {
            const days = Math.floor((Date.now() - new Date(j.created_at)) / 86400000)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' }}>
                <Clock size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{j.job_number}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{j.customers?.name}</div>
                </div>
                <span style={{ fontSize: 10, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                  {days}d open
                </span>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

/* ── Top bar ─────────────────────────────────────────── */
function TopBar({ theme, toggleTheme, onMenuOpen, user }) {
  const { search, setSearch } = useSearch()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const bellRef = useRef(null)
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const email    = user?.email || `${(user?.name || '').toLowerCase().replace(/\s+/g, '.')}@pitstop.shop`

  const settingsPath = user?.role === 'manager' || user?.role === 'admin'
    ? '/manager/settings'
    : '/receptionist/settings'

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

      {/* Search */}
      <div className="searchbar">
        <Search size={16} />
        <input
          placeholder="Search jobs, plates, customers…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search"
        />
        <kbd>⌘K</kbd>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notification bell */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            title="Notifications"
            aria-label="Notifications"
            onClick={() => setNotifOpen(v => !v)}
          >
            <Bell size={16} />
            <span className="dot" />
          </button>
          {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
        </div>

        {/* Settings */}
        <button
          className="icon-btn"
          title="Settings"
          aria-label="Settings"
          onClick={() => navigate(settingsPath)}
        >
          <Settings size={16} />
        </button>

        {/* Profile chip */}
        <div className="profile-chip" style={{ gap: 8 }}>
          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="profile-name" style={{ fontSize: 12 }}>{user?.name}</div>
            <div className="profile-role" style={{ fontSize: 10.5 }}>{email}</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--text-dim)', flexShrink: 0 }}>
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
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
    document.documentElement.setAttribute('data-accent', 'monochrome')
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
        <TopBar theme={theme} toggleTheme={toggleTheme} onMenuOpen={() => setDrawerOpen(true)} user={user} />
        <main className="page">
          {children}
        </main>
      </div>

      {/* ── Mobile show-menu button (injected via CSS) ─── */}
      <style>{`
        @media (max-width: 880px) {
          #mobile-menu-btn { display: grid !important; }
          .searchbar { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}
