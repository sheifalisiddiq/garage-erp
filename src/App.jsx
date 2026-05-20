import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SearchProvider } from './context/SearchContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import ShopSelect from './pages/admin/ShopSelect'
import ReceptionistDashboard from './pages/receptionist/Dashboard'
import NewJob from './pages/receptionist/NewJob'
import JobDetail from './pages/receptionist/JobDetail'
import InvoiceList from './pages/receptionist/InvoiceList'
import QuoteList from './pages/receptionist/QuoteList'
import NewQuote from './pages/receptionist/NewQuote'
import QuoteDetail from './pages/receptionist/QuoteDetail'
import Settings from './pages/receptionist/Settings'
import Inventory from './pages/manager/Inventory'
import ManagerDashboard from './pages/manager/Dashboard'
import ManagerJobs from './pages/manager/Jobs'

function homeFor(role) {
  if (role === 'admin') return '/admin'
  if (role === 'manager') return '/manager'
  return '/receptionist'
}

function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (requiredRole) {
    const allowed =
      user.role === requiredRole ||
      (requiredRole === 'manager' && user.role === 'admin')
    if (!allowed) return <Navigate to={homeFor(user.role)} replace />
  }
  return <Layout>{children}</Layout>
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to={homeFor(user.role)} replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to={homeFor(user.role)} replace /> : <Login />
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <AdminRoute><ShopSelect /></AdminRoute>
      } />

      {/* Receptionist routes */}
      <Route path="/receptionist" element={
        <ProtectedRoute requiredRole="receptionist"><ReceptionistDashboard /></ProtectedRoute>
      } />
      <Route path="/receptionist/new-job" element={
        <ProtectedRoute requiredRole="receptionist"><NewJob /></ProtectedRoute>
      } />
      <Route path="/receptionist/jobs/:id" element={
        <ProtectedRoute requiredRole="receptionist"><JobDetail /></ProtectedRoute>
      } />
      <Route path="/receptionist/invoices" element={
        <ProtectedRoute requiredRole="receptionist"><InvoiceList /></ProtectedRoute>
      } />
      <Route path="/receptionist/inventory" element={
        <ProtectedRoute requiredRole="receptionist"><Inventory /></ProtectedRoute>
      } />
      <Route path="/receptionist/quotes" element={
        <ProtectedRoute requiredRole="receptionist"><QuoteList /></ProtectedRoute>
      } />
      <Route path="/receptionist/quotes/new" element={
        <ProtectedRoute requiredRole="receptionist"><NewQuote /></ProtectedRoute>
      } />
      <Route path="/receptionist/quotes/:id" element={
        <ProtectedRoute requiredRole="receptionist"><QuoteDetail /></ProtectedRoute>
      } />
      <Route path="/receptionist/settings" element={
        <ProtectedRoute requiredRole="receptionist"><Settings /></ProtectedRoute>
      } />

      {/* Manager routes (admin can also access) */}
      <Route path="/manager" element={
        <ProtectedRoute requiredRole="manager"><ManagerDashboard /></ProtectedRoute>
      } />
      <Route path="/manager/jobs" element={
        <ProtectedRoute requiredRole="manager"><ManagerJobs /></ProtectedRoute>
      } />
      <Route path="/manager/inventory" element={
        <ProtectedRoute requiredRole="manager"><Inventory /></ProtectedRoute>
      } />
      <Route path="/manager/quotes" element={
        <ProtectedRoute requiredRole="manager"><QuoteList /></ProtectedRoute>
      } />
      <Route path="/manager/quotes/:id" element={
        <ProtectedRoute requiredRole="manager"><QuoteDetail /></ProtectedRoute>
      } />

      {/* Default */}
      <Route path="/" element={
        <Navigate to={user ? homeFor(user.role) : '/login'} replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SearchProvider>
          <AppRoutes />
        </SearchProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
