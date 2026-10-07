import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import logoImage from '../../assets/logo.png'

const navItems = [
  { label: 'Jobs', to: '/jobs' },
  { label: 'Companies', to: '/companies' },
  { label: 'Career Resources', to: '/resources' },
  { label: 'About', to: '/about' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('menu-open', mobileOpen)
    return () => document.body.classList.remove('menu-open')
  }, [mobileOpen])

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label="Clyptus home">
          <img src={logoImage} alt="Clyptus logo" className="brand-logo" />
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <Link to="/login" className="header-link">
            Login
          </Link>
          <Link to="/register" className="button button-primary button-small">
            Register
          </Link>
        </div>

        <button
          type="button"
          className="mobile-toggle"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="mobile-menu" role="dialog" aria-modal="true">
          <div className="mobile-menu-panel">
            <nav className="mobile-nav" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="mobile-actions">
                <Link to="/login" className="header-link" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="button button-primary button-small" onClick={() => setMobileOpen(false)}>
                  Register
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
