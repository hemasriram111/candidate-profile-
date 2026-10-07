import { ArrowRight, MapPin, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Company } from '../../types/company.types'

type CompanyCardProps = {
  company: Company
}

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <article className="company-card">
      <div className="company-card-top">
        <div className="company-avatar company-avatar-large" aria-label={`${company.name} company logo`}>
          {company.logo}
        </div>
      </div>
      <div className="company-card-body">
        <h3>{company.name}</h3>
        <div className="info-row subtle-row">
          <span>{company.industry}</span>
        </div>
        <div className="info-row">
          <MapPin size={14} />
          <span>{company.location}</span>
        </div>
        <div className="info-row">
          <Users size={14} />
          <span>{company.openPositions} open roles</span>
        </div>
      </div>
      <div className="company-card-footer">
        <Link to={`/companies/${company.id}`} className="text-link">
          Explore Company <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  )
}
