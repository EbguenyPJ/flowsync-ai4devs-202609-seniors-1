import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/lib/auth'

/** Rutas que requieren sesión: sin token, a /login. */
export function ProtectedRoute() {
  const { token } = useAuth()
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

/** Login y registro: si ya hay sesión, no tiene sentido mostrarlos. */
export function GuestRoute() {
  const { token } = useAuth()
  return token ? <Navigate to="/profile" replace /> : <Outlet />
}
