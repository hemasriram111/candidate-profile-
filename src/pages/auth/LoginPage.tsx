import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import logoImage from '../../assets/logo.png'
import loginImage from '../../assets/login image.png'
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton'
import { useAuth } from '../../components/common/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, loginWithGoogle, isLoading } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    try {
      await login(form.email, form.password)
      navigate('/candidate/profile', { replace: true })
    } catch (submitError) {
      if (submitError instanceof Error && 'requiresEmailVerification' in submitError && submitError.requiresEmailVerification) {
        const loginError = submitError as Error & { email?: string; resendCooldownSeconds?: number }
        const email = loginError.email || form.email
        const cooldown = loginError.resendCooldownSeconds ?? 0
        navigate(`/verify-email?email=${encodeURIComponent(email)}&cooldown=${cooldown}`, { replace: true })
        return
      }

      const message = submitError instanceof Error ? submitError.message : 'Login failed. Please try again.'
      setError(message)
    }
  }

  return (
    <div className="auth-panel">
      <div className="auth-visual-panel">
        <img src={loginImage} alt="" className="auth-visual-image" />
        <div className="brand auth-brand">
          <img src={logoImage} alt="Clyptus logo" className="brand-logo brand-logo-auth" />
        </div>
        <p className="auth-visual-copy">Build a stronger next chapter with opportunities that match your skills and ambition.</p>
      </div>

      <div className="auth-form-panel">
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Continue your Clyptus journey.</p>

        <GoogleSignInButton
          label="Continue with Google"
          onSuccess={async (credential) => {
            await loginWithGoogle(credential)
            navigate('/candidate/profile', { replace: true })
          }}
          onError={(message) => setError(message)}
          disabled={isLoading}
        />

        <div className="divider"><span>or</span></div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <div className="auth-password-control">
            <label htmlFor="login-password">Password</label>
            <div className="auth-password-field">
              <input
                id="login-password"
                type={isPasswordVisible ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                aria-pressed={isPasswordVisible}
                onClick={() => setIsPasswordVisible((visible) => !visible)}
              >
                {isPasswordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className="auth-row">
            <label className="checkbox-row">
              <input type="checkbox" defaultChecked />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          {error ? <p className="success-note" style={{ background: 'rgba(220,38,38,0.08)', color: '#b91c1c' }}>{error}</p> : null}

          <button type="submit" className="button button-primary auth-submit" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="switch-copy">
          Don’t have an account? <Link to="/register">Create Account</Link>
        </p>
      </div>
    </div>
  )
}
