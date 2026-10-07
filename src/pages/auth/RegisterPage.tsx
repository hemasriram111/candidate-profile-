import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import logoImage from '../../assets/logo.png'
import signupImage from '../../assets/sign up.png'
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton'
import { useAuth } from '../../components/common/AuthContext'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register, loginWithGoogle, isLoading } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    termsAccepted: false,
  })
  const [error, setError] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!form.termsAccepted) {
      setError('You must agree to the terms and conditions.')
      return
    }

    if (form.password !== form.passwordConfirm) {
      setError('Passwords do not match.')
      return
    }

    try {
      const result = await register({
        fullName: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.passwordConfirm,
        role: 'candidate',
      })
      navigate(`/verify-email?email=${encodeURIComponent(result.email)}&cooldown=${result.resendCooldownSeconds}`, { replace: true })
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Registration failed. Please try again.'
      setError(message)
    }
  }

  return (
    <div className="auth-panel auth-register-panel">
      <div className="auth-visual-panel">
        <img src={signupImage} alt="" className="auth-visual-image" />
        <div className="brand auth-brand">
          <img src={logoImage} alt="Clyptus logo" className="brand-logo brand-logo-auth" />
        </div>
        <p className="auth-visual-copy">Build a stronger next chapter with opportunities that match your skills and ambition.</p>
      </div>

      <div className="auth-form-panel auth-form-large">
        <h1>Create your Clyptus account</h1>

        <GoogleSignInButton
          label="Continue with Google"
          onSuccess={async (credential) => {
            await loginWithGoogle(credential)
            navigate('/candidate/profile', { replace: true })
          }}
          onError={(message) => setError(message)}
          disabled={isLoading}
        />

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Full Name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              autoComplete="name"
              required
            />
          </label>
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
            <label htmlFor="register-password">Password</label>
            <div className="auth-password-field">
              <input
                id="register-password"
                type={isPasswordVisible ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                autoComplete="new-password"
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
          <div className="auth-password-control">
            <label htmlFor="register-password-confirm">Confirm Password</label>
            <div className="auth-password-field">
              <input
                id="register-password-confirm"
                type={isPasswordConfirmVisible ? 'text' : 'password'}
                name="passwordConfirm"
                value={form.passwordConfirm}
                onChange={handleChange}
                placeholder="Confirm your password"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                aria-label={isPasswordConfirmVisible ? 'Hide password' : 'Show password'}
                aria-pressed={isPasswordConfirmVisible}
                onClick={() => setIsPasswordConfirmVisible((visible) => !visible)}
              >
                {isPasswordConfirmVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          <label className="checkbox-row checkbox-row-spaced">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={form.termsAccepted}
              onChange={handleChange}
            />
            <span>I agree to the Terms and Conditions</span>
          </label>

          {error ? <p className="success-note" style={{ background: 'rgba(220,38,38,0.08)', color: '#b91c1c' }}>{error}</p> : null}

          <button type="submit" className="button button-primary auth-submit" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="switch-copy">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
