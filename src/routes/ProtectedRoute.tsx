import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../components/common/AuthContext'
import type { Role } from '../types/auth'

type ProtectedRouteProps = {
  children: ReactElement
  requiredRole?: Role
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="auth-panel auth-small-panel">
        <div className="auth-form-panel">
          <h1>Loading...</h1>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'candidate' ? '/candidate/dashboard' : '/employer/dashboard'} replace />
  }

  return children
}

export function GuestRoute({ children }: { children: ReactElement }) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="auth-panel auth-small-panel">
        <div className="auth-form-panel">
          <h1>Loading...</h1>
        </div>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'candidate' ? '/candidate/dashboard' : '/employer/dashboard'} replace />
  }

  return children
}

export function RoleRoute({ children, allowedRoles }: { children: ReactElement; allowedRoles: Role[] }) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="auth-panel auth-small-panel">
        <div className="auth-form-panel">
          <h1>Loading...</h1>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (!user.role || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
