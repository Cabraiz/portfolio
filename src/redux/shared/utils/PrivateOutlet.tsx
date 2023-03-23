import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function PrivateOutlet() {
  const auth = useAuth()
  const location = useLocation()

  return auth.user ? (
    <Outlet />
  ) : (
    <Navigate to="/loginhublocal" state={{ from: location }} replace/>
  )
}
