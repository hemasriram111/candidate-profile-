import { ArrowUpRight, Globe, Mail, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import logoImage from '../../assets/logo.png'

const candidateLinks = [
  { label: 'Find Jobs', to: '/jobs' },
  { label: 'Saved Jobs', to: '/jobs' },
  { label: 'Applications', to: '/login' },
  { label: 'Job Alerts', to: '/jobs' },
  { label: 'Career Resources', to: '/resources' },
]

const companyLinks = [
  { label: 'Post a Job', to: '/contact' },
  { label: 'Find Talent', to: '/companies' },
  { label: 'Recruiter Login', to: '/login' },
]

const companyInfoLinks = [
  { label: 'About Clyptus', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Careers', to: '/about' },
  { label: 'Blog', to: '/resources' },
]

const legalLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Policy']

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-block">
          <Link to="/" className="brand brand-footer" aria-label="Clyptus home">
            <img src={logoImage} alt="Clyptus logo" className="brand-logo brand-logo-footer" />
          </Link>
          <p>
            A premium job platform for professionals who want meaningful work, better opportunities and a clearer path forward.
          </p>
          <div className="footer-socials" aria-label="Social media links">
            <a href="/" aria-label="LinkedIn"><Globe size={16} /></a>
            <a href="/" aria-label="Mail"><Mail size={16} /></a>
            <a href="/" aria-label="Career opportunities"><Sparkles size={16} /></a>
          </div>
        </div>

        <div className="footer-column">
          <h3>Candidate</h3>
          <ul>
            {candidateLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-column">
          <h3>Companies</h3>
          <ul>
            {companyLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-column">
          <h3>Company</h3>
          <ul>
            {companyInfoLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-column">
          <h3>Legal</h3>
          <ul>
            {legalLinks.map((label) => (
              <li key={label}>
                <a href="/">{label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© 2026 Clyptus. All rights reserved.</span>
        <span className="footer-note"><ArrowUpRight size={14} /> Built for career momentum</span>
      </div>
    </footer>
  )
}
