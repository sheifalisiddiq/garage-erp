import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const DEMO_USERS = {
  receptionist: {
    id: 'demo-receptionist',
    name: 'Mariam Al-Zaabi',
    role: 'receptionist',
    phone: '+971501112233',
  },
  manager: {
    id: 'demo-manager',
    name: 'Saeed Al-Mansoori',
    role: 'manager',
    phone: '+971502223344',
  },
  admin: {
    id: 'demo-admin',
    name: 'Ahmad Al-Rashid',
    role: 'admin',
    phone: '+971503334455',
  },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('garage_erp_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const login = (role) => {
    const u = DEMO_USERS[role]
    setUser(u)
    localStorage.setItem('garage_erp_user', JSON.stringify(u))
    return u
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('garage_erp_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
