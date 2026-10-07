import apiClient from './apiClient'

export type AuthResponse = {
  user: {
    id: string
    email: string
    name?: string
    fullName?: string
    firstName?: string
    lastName?: string
    role: 'candidate' | 'employer' | 'admin'
    profile?: Record<string, unknown> | null
    onboardingComplete?: boolean
    resumeReadyForReview?: boolean
  }
  message?: string
}

export type RegistrationVerificationResponse = {
  requiresEmailVerification: true
  email: string
  message: string
  resendCooldownSeconds: number
}

export type ResendVerificationResponse = {
  message: string
  resendCooldownSeconds: number
}

export const authService = {
  async register(payload: { fullName: string; email: string; password: string; confirmPassword: string }) {
    const response = await apiClient.post<RegistrationVerificationResponse>('/auth/register', payload)
    return response.data
  },

  async login(payload: { email: string; password: string }) {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload)
    return response.data
  },

  async googleLogin(credential: string) {
    const response = await apiClient.post<AuthResponse>('/auth/google', { credential })
    return response.data
  },

  async verifyEmail(payload: { email: string; otp: string }) {
    const response = await apiClient.post<AuthResponse>('/auth/verify-email', payload)
    return response.data
  },

  async resendVerification(email: string) {
    const response = await apiClient.post<ResendVerificationResponse>('/auth/resend-verification', { email })
    return response.data
  },

  async logout() {
    const response = await apiClient.post<{ success: boolean }>('/auth/logout')
    return response.data
  },

  async getCurrentUser() {
    const response = await apiClient.get<{ user: AuthResponse['user'] }>('/auth/me')
    return response.data
  },
}
