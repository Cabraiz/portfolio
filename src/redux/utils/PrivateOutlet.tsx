import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import * as serviceWorker from "../../serviceWorker";


serviceWorker.unregister();

export function PrivateOutlet() {
  const auth = useAuth()
  const location = useLocation()

  return auth.user ? (
    <Outlet />
  ) : (
    <Navigate to="/LoginHubLocal" state={{ from: location }} />
  )
}
