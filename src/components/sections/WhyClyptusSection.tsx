import { BriefcaseBusiness, Gauge, Sparkles, Target } from 'lucide-react'
import { SectionHeader } from '../common/SectionHeader'

const reasons = [
  { icon: Target, title: 'Relevant Opportunities', description: 'Discover jobs aligned with your skills, interests and long-term goals.' },
  { icon: BriefcaseBusiness, title: 'One Professional Profile', description: 'Keep your experience, skills and resume organised in a single place.' },
  { icon: Gauge, title: 'Application Tracking', description: 'See where every opportunity stands and what to do next.' },
  { icon: Sparkles, title: 'Smarter Career Discovery', description: 'Use intelligent recommendations to uncover roles that fit your path.' },
]

export function WhyClyptusSection() {
  return (
    <section className="why-section">
      <div className="container">
        <SectionHeader eyebrow="Why Clyptus" title="Built around your career journey." description="A job platform designed to help you navigate opportunity with confidence and clarity." />

        <div className="value-grid">
          {reasons.map(({ icon: Icon, title, description }) => (
            <div key={title} className="value-card">
              <div className="value-icon"><Icon size={20} /></div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
