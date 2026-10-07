import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { mockResources } from '../../data/mock/mockResources'
import { Badge } from '../common/Badge'
import { SectionHeader } from '../common/SectionHeader'

export function ResourcesSection() {
  return (
    <section className="resources-section">
      <div className="container">
        <SectionHeader
          eyebrow="Career resources"
          title="Practical guidance for your next move"
          description="Insights and advice to help you sharpen your profile, prepare for interviews and find the right opportunities."
        />

        <div className="resource-grid">
          {mockResources.map((resource) => (
            <article key={resource.id} className="resource-card">
              <div className="resource-header">
                <Badge tone="blue">{resource.type}</Badge>
                <span>{resource.readTime}</span>
              </div>
              <h3>{resource.title}</h3>
              <p>{resource.excerpt}</p>
              <Link to="/resources" className="text-link">
                Read article <ArrowUpRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
