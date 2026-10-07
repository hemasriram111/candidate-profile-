import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import logoImage from '../../assets/logo.png'
import { useAuth } from '../../components/common/AuthContext'

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const data = (error as { response?: { data?: { message?: string | string[]; retryAfterSeconds?: number } } }).response?.data
    if (Array.isArray(data?.message)) return data.message.join(' ')
    if (data?.message) return data.message
  }
  return error instanceof Error ? error.message : fallback
}

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { verifyEmail, resendVerification } = useAuth()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [otp, setOtp] = useState('')
  const [cooldown, setCooldown] = useState(() => {
    const value = Number(searchParams.get('cooldown') ?? 0)
    return Number.isFinite(value) ? Math.max(0, value) : 0
  })
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (cooldown <= 0) return
    const timeout = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timeout)
  }, [cooldown])

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setStatus('')
    setIsVerifying(true)

    try {
      await verifyEmail(email.trim(), otp)
      setStatus('Verification successful.')
      navigate('/candidate/onboarding', { replace: true })
    } catch (submitError) {
      setError(getRequestErrorMessage(submitError, 'Email verification failed. Please try again.'))
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setStatus('')
    setIsResending(true)

    try {
      const response = await resendVerification(email.trim())
      setCooldown(response.resendCooldownSeconds)
      setStatus(response.message)
    } catch (resendError) {
      const retryAfterSeconds = typeof resendError === 'object' && resendError !== null && 'response' in resendError
        ? (resendError as { response?: { data?: { retryAfterSeconds?: number } } }).response?.data?.retryAfterSeconds
        : undefined
      if (retryAfterSeconds) setCooldown(retryAfterSeconds)
      setError(getRequestErrorMessage(resendError, 'Could not resend the verification code. Please try again.'))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="auth-panel auth-small-panel">
      <div className="auth-form-panel">
        <div className="brand auth-brand">
          <img src={logoImage} alt="Clyptus logo" className="brand-logo brand-logo-auth" />
        </div>
        <h1>Verify your email</h1>
        <p className="auth-subtitle">We&apos;ve sent a 6-digit verification code to your email.</p>
        <p className="auth-subtitle">Code expires in 10 minutes.</p>

        <form onSubmit={handleVerify} className="auth-form">
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            <span>6-digit verification code</span>
            <input
              type="text"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
          </label>

          {error ? <p role="alert" className="success-note" style={{ background: 'rgba(220,38,38,0.08)', color: '#b91c1c' }}>{error}</p> : null}
          {status ? <p role="status" className="success-note">{status}</p> : null}

          <button type="submit" className="button button-primary auth-submit" disabled={isVerifying || isResending || otp.length !== 6}>
            {isVerifying ? 'Verifying...' : 'Verify Email'}
          </button>
          <button
            type="button"
            className="button button-secondary auth-submit"
            onClick={() => void handleResend()}
            disabled={isVerifying || isResending || cooldown > 0 || !email.trim()}
          >
            {isResending ? 'Sending...' : cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
          </button>
          <p className="switch-copy">
            <Link to="/login">Back to Login</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
