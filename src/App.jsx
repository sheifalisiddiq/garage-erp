import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import ReceptionistDashboard from './pages/receptionist/Dashboard'
import NewJob from './pages/receptionist/NewJob'
import JobDetail from './pages/receptionist/JobDetail'
import InvoiceList from './pages/receptionist/InvoiceList'
import QuoteList from './pages/receptionist/QuoteList'
import NewQuote from './pages/receptionist/NewQuote'
import QuoteDetail from './pages/receptionist/QuoteDetail'
import ManagerDashboard from './pages/manager/Dashboard'
import ManagerJobs from './pages/manager/Jobs'
import Inventory from './pages/manager/Inventory'

function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'manager' ? '/manager' : '/receptionist'} replace />
  }
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to={user.role === 'manager' ? '/manager' : '/receptionist'} replace /> : <Login />
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
      <Route path="/receptionist/quotes" element={
        <ProtectedRoute requiredRole="receptionist"><QuoteList /></ProtectedRoute>
      } />
      <Route path="/receptionist/quotes/new" element={
        <ProtectedRoute requiredRole="receptionist"><NewQuote /></ProtectedRoute>
      } />
      <Route path="/receptionist/quotes/:id" element={
        <ProtectedRoute requiredRole="receptionist"><QuoteDetail /></ProtectedRoute>
      } />

      {/* Manager routes */}
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
        <Navigate to={user ? (user.role === 'manager' ? '/manager' : '/receptionist') : '/login'} replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
