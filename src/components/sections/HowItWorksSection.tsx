import { SectionHeader } from '../common/SectionHeader'

const steps = [
  { step: '01', title: 'Create your profile', description: 'Share your experience, skills and goals in a clear professional profile.' },
  { step: '02', title: 'Discover relevant opportunities', description: 'Find roles that align with your strengths, interests and next move.' },
  { step: '03', title: 'Apply and track', description: 'Move through applications with a clear view of status and next actions.' },
  { step: '04', title: 'Interview and get hired', description: 'Prepare, follow up and step confidently into the final stages.' },
]

export function HowItWorksSection() {
  return (
    <section className="how-section">
      <div className="container">
        <SectionHeader eyebrow="How Clyptus works" title="A stronger search with a clearer path" description="Designed to help candidates move from intent to opportunity with less friction." />
        <div className="step-grid">
          {steps.map((item) => (
            <div key={item.step} className="step-card">
              <span className="step-number">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
