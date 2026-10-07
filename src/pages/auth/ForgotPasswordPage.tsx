import { useState } from 'react'
import { Link } from 'react-router-dom'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="auth-panel auth-small-panel">
      <div className="auth-form-panel">
        <h1>Forgot your password?</h1>
        <form className="auth-form" onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
        }}>
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </label>
          <button type="submit" className="button button-primary auth-submit">Send Reset Link</button>
          {submitted && <p className="success-note">Reset link generated in prototype mode.</p>}
        </form>

        <p className="switch-copy">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  )
}
