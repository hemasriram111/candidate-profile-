export type Role = 'candidate' | 'employer' | 'admin'

export type AuthSessionUser = {
  id?: string
  email?: string
  name?: string
  fullName?: string
  firstName?: string
  lastName?: string
  username?: string
  role?: Role
  profile?: Record<string, unknown> | null
  onboardingComplete?: boolean
  resumeReadyForReview?: boolean
}
