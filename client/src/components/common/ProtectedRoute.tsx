import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuthStore } from "../../store/auth.store"

interface Props {
  allowedRoles?: string[]
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const location = useLocation()
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    const isCustomerRoute = allowedRoles?.length === 1 && allowedRoles.includes("customer")
    const target = isCustomerRoute
      ? `/login?as=customer&next=${encodeURIComponent(location.pathname)}`
      : "/login"
    return <Navigate to={target} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
