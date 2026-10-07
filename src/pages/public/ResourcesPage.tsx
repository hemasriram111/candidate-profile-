import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/common/Badge'
import { SectionHeader } from '../../components/common/SectionHeader'
import { mockResources } from '../../data/mock/mockResources'

export function ResourcesPage() {
  return (
    <section className="page-shell">
      <div className="container">
        <SectionHeader eyebrow="Career resources" title="Advice for smarter applications and stronger career decisions." description="Explore practical guidance designed to help you improve your profile and move forward with clarity." />

        <div className="resource-grid double-grid">
          {mockResources.map((resource) => (
            <article key={resource.id} className="resource-card large-card">
              <div className="resource-header">
                <Badge tone="blue">{resource.type}</Badge>
                <span>{resource.readTime}</span>
              </div>
              <h3>{resource.title}</h3>
              <p>{resource.excerpt}</p>
              <Link to="/resources" className="text-link">
                Read article <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
