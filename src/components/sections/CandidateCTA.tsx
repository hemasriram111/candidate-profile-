import { Link } from 'react-router-dom'
import opportunitiesImage from '../../assets/opportunities.png'

export function CandidateCTA() {
  return (
    <section className="cta-section">
      <div className="container cta-panel">
        <div className="cta-copy">
          <span className="eyebrow eyebrow-light">Next step</span>
          <h2>Your next opportunity is closer than you think.</h2>
          <p>
            Create your Clyptus profile, discover relevant opportunities and take the next step in your career.
          </p>
          <div className="cta-actions">
            <Link to="/register" className="button button-primary">
              Create Your Profile
            </Link>
            <Link to="/jobs" className="button button-secondary cta-secondary">
              Explore Jobs
            </Link>
          </div>
        </div>
        <img src={opportunitiesImage} alt="Career opportunities" className="cta-visual" />
      </div>
    </section>
  )
}
