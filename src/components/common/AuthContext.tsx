import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import type { AuthSessionUser, Role } from '../../types/auth'
import {
  authService,
  type AuthResponse,
  type RegistrationVerificationResponse,
  type ResendVerificationResponse,
} from '../../services/authService'
import { getDashboardPath } from '../../utils/auth'

type AuthUser = AuthSessionUser | null

type LoginPayload = {
  email: string
  password: string
}

type RegisterPayload = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  role?: Role
}

type AuthContextValue = {
  user: AuthUser
  isLoading: boolean
  isAuthenticated: boolean
  refreshSession: () => Promise<AuthUser>
  login: (credentials: LoginPayload | string, password?: string) => Promise<AuthUser>
  register: (payload: RegisterPayload | string, email?: string, password?: string, confirmPassword?: string) => Promise<RegistrationVerificationResponse>
  loginWithGoogle: (credential: string) => Promise<AuthUser>
  verifyEmail: (email: string, otp: string) => Promise<AuthUser>
  resendVerification: (email: string) => Promise<ResendVerificationResponse>
  logout: () => Promise<void>
  role: Role | undefined
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export { getDashboardPath }

function getApiErrorDetails(error: unknown) {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return { message: error instanceof Error ? error.message : 'Authentication failed. Please try again.' }
  }

  const data = (error as { response?: { data?: Record<string, unknown> } }).response?.data
  const rawMessage = data?.message
  const message = Array.isArray(rawMessage)
    ? rawMessage.join(' ')
    : typeof rawMessage === 'string'
      ? rawMessage
      : error instanceof Error
        ? error.message
        : 'Authentication failed. Please try again.'

  return {
    message,
    requiresEmailVerification: data?.requiresEmailVerification === true,
    email: typeof data?.email === 'string' ? data.email : undefined,
    resendCooldownSeconds: typeof data?.resendCooldownSeconds === 'number' ? data.resendCooldownSeconds : undefined,
  }
}

function toAuthSessionUser(user: AuthResponse['user']): AuthSessionUser {
  const name = user.name || user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ')

  return {
    ...user,
    name,
    role: (user.role ?? 'candidate').toLowerCase() as Role,
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = async (): Promise<AuthUser> => {
    setIsLoading(true)

    try {
      const response = await authService.getCurrentUser()
      const restoredUser = response.user ? toAuthSessionUser(response.user) : null
      setUser(restoredUser)
      return restoredUser
    } catch {
      setUser(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshSession()
  }, [])

  const normalizeLogin = (value: LoginPayload | string, password?: string) => {
    if (typeof value === 'string') {
      return {
        email: value,
        password: password ?? '',
      }
    }

    return {
      email: value.email,
      password: value.password,
    }
  }

  const normalizeRegister = (value: RegisterPayload | string, _email?: string, password?: string, confirmPassword?: string) => {
    if (typeof value === 'string') {
      return {
        fullName: '',
        email: value,
        password: password ?? '',
        confirmPassword: confirmPassword ?? '',
        role: 'candidate' as Role,
      }
    }

    return {
      fullName: value.fullName,
      email: value.email,
      password: value.password,
      confirmPassword: value.confirmPassword,
      role: value.role ?? 'candidate',
    }
  }

  const login = async (credentials: LoginPayload | string, password?: string) => {
    const { email, password: nextPassword } = normalizeLogin(credentials, password)
    if (!email || !nextPassword) {
      throw new Error('Email and password are required.')
    }

    setIsLoading(true)

    try {
      const response = await authService.login({ email, password: nextPassword })
      const nextUser = toAuthSessionUser(response.user)
      setUser(nextUser)
      return nextUser
    } catch (error) {
      const details = getApiErrorDetails(error)
      const loginError = new Error(details.message) as Error & {
        requiresEmailVerification?: boolean
        email?: string
        resendCooldownSeconds?: number
      }
      loginError.requiresEmailVerification = details.requiresEmailVerification
      loginError.email = details.email
      loginError.resendCooldownSeconds = details.resendCooldownSeconds
      throw loginError
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (payload: RegisterPayload | string, email?: string, password?: string, confirmPassword?: string) => {
    const normalized = normalizeRegister(payload, email, password, confirmPassword)

    if (!normalized.fullName || !normalized.email || !normalized.password) {
      throw new Error('Please complete all required registration fields.')
    }

    if (normalized.password !== normalized.confirmPassword) {
      throw new Error('Passwords do not match.')
    }

    setIsLoading(true)

    try {
      const response = await authService.register({
        fullName: normalized.fullName,
        email: normalized.email,
        password: normalized.password,
        confirmPassword: normalized.confirmPassword,
      })
      return response
    } catch (error) {
      throw new Error(getApiErrorDetails(error).message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async (credential: string) => {
    if (!credential) {
      throw new Error('Google authentication failed.')
    }

    setIsLoading(true)

    try {
      const response = await authService.googleLogin(credential)
      const nextUser = toAuthSessionUser(response.user)

      setUser(nextUser)
      return nextUser
    } catch (error) {
      const apiMessage = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined

      const message = apiMessage || (error instanceof Error ? error.message : 'Google authentication failed.')
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const verifyEmail = async (email: string, otp: string) => {
    setIsLoading(true)

    try {
      const response = await authService.verifyEmail({ email, otp })
      const nextUser = toAuthSessionUser(response.user)
      setUser(nextUser)
      return nextUser
    } catch (error) {
      throw new Error(getApiErrorDetails(error).message || 'Email verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resendVerification = async (email: string) => authService.resendVerification(email)

  const logout = async () => {
    setIsLoading(true)

    try {
      await authService.logout()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      refreshSession,
      login,
      register,
      loginWithGoogle,
      verifyEmail,
      resendVerification,
      logout,
      role: user?.role,
    }),
    [user, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }

  return context
}
