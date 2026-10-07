import { BrainCircuit, LineChart, Sparkles, Wand2 } from 'lucide-react'
import { SectionHeader } from '../common/SectionHeader'
import workingWomanImage from '../../assets/women working in laptop.png'

const capabilities = [
  { icon: BrainCircuit, title: 'AI job recommendations', description: 'Prioritise roles matched to your strengths and goals.' },
  { icon: Wand2, title: 'Resume insights', description: 'Understand where your profile stands and how to improve it.' },
  { icon: LineChart, title: 'Skill gap analysis', description: 'Identify the capabilities most likely to open future opportunities.' },
  { icon: Sparkles, title: 'Interview preparation', description: 'Get tailored guidance before the next conversation.' },
]

export function AICareerSection() {
  return (
    <section className="ai-section">
      <div className="container ai-panel">
        <div className="ai-copy">
          <SectionHeader eyebrow="Career tools" title="Tools that help you search smarter." description="Use practical AI support to find roles faster, sharpen your profile, and prepare for what comes next." />
          <ul className="capability-list">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <li key={title}>
                <div className="capability-icon"><Icon size={16} /></div>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="ai-visual">
          <img src={workingWomanImage} alt="Professional woman working on a laptop" className="ai-visual-image" />
        </div>
      </div>
    </section>
  )
}
