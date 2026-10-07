import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

type ProtectedRouteProps = {
  children: ReactElement
  requiredRole?: 'candidate' | 'employer' | 'admin'
  requireCandidateOnboarding?: boolean
}

export function ProtectedRoute({ children, requiredRole, requireCandidateOnboarding = false }: ProtectedRouteProps) {
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
    return <Navigate to={user.role === 'candidate' ? '/candidate/profile' : '/login'} replace />
  }

  const mayReviewParsedResume = location.pathname === '/candidate/profile' && user.resumeReadyForReview
  const isCandidateOnboarding = location.pathname === '/candidate/onboarding' || location.pathname === '/candidate/upload-resume'
  if (requireCandidateOnboarding && user.role === 'candidate' && user.onboardingComplete === false && !mayReviewParsedResume && !isCandidateOnboarding) {
    return <Navigate to="/candidate/onboarding" replace state={{ from: location }} />
  }

  return children
}
