import { CheckCircle2, Circle, Clock3 } from 'lucide-react'

import { SectionHeader } from '../common/SectionHeader'

const stages = [
  { label: 'Applied', complete: true },
  { label: 'Screening', complete: true },
  { label: 'Technical Interview', complete: true, active: true },
  { label: 'Final Interview', complete: false },
  { label: 'Offer', complete: false },
]

export function ApplicationTrackerSection() {
  return (
    <section className="section-space neutral-bg">
      <div className="container application-layout">
        <div className="application-copy">
          <SectionHeader
            eyebrow="Application tracking"
            title="Stay on top of every step."
            description="Track where your application stands and what happens next without jumping between tabs or messages."
          />
        </div>
        <ol className="timeline-wrap" aria-label="Application stages">
          {stages.map((stage) => (
            <li
              key={stage.label}
              className={`timeline-item ${stage.active ? 'active' : ''}`}
            >
              <div className="timeline-marker">
                {stage.complete ? <CheckCircle2 size={18} /> : stage.active ? <Clock3 size={18} /> : <Circle size={18} />}
              </div>
              <div className="timeline-content">
                <span>{stage.label}</span>
                <small>{stage.complete ? 'Completed' : stage.active ? 'Current stage' : 'Queued'}</small>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
