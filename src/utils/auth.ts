import type { Role } from '../types/auth'

export function getDashboardPath(role?: Role) {
  if (role === 'employer') {
    return '/employer/dashboard'
  }

  return '/candidate/profile'
}
