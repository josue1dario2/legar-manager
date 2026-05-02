import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import AuthCallback from '@/pages/auth/AuthCallback'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import DashboardPage from '@/pages/cliente/DashboardPage'
import RegistrosPage from '@/pages/cliente/RegistrosPage'
import RegistroFormPage from '@/pages/cliente/RegistroFormPage'
import AlertasPage from '@/pages/cliente/AlertasPage'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminClientesPage from '@/pages/admin/AdminClientesPage'
import AdminRegistrosPage from '@/pages/admin/AdminRegistrosPage'

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function AppRoutes() {
  const { user, isAdmin } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={isAdmin() ? '/admin/dashboard' : '/dashboard'} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/registros" element={<ProtectedRoute><RegistrosPage /></ProtectedRoute>} />
      <Route path="/registros/new" element={<ProtectedRoute><RegistroFormPage /></ProtectedRoute>} />
      <Route path="/registros/:id" element={<ProtectedRoute><RegistroFormPage /></ProtectedRoute>} />
      <Route path="/alertas" element={<ProtectedRoute><AlertasPage /></ProtectedRoute>} />
      
      <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/clientes" element={<ProtectedRoute requireAdmin><AdminClientesPage /></ProtectedRoute>} />
      <Route path="/admin/registros" element={<ProtectedRoute requireAdmin><AdminRegistrosPage /></ProtectedRoute>} />
      
      <Route path="/" element={<Navigate to={user ? (isAdmin() ? '/admin/dashboard' : '/dashboard') : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}