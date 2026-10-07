import { useEffect, useState } from 'react'
import { Building2, MapPin, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { companyService } from '../../services/companyService'
import { jobService } from '../../services/jobService'
import type { Company } from '../../types/company.types'
import type { Job } from '../../types/job.types'

export function CompanyDetailPage() {
  const { companyId } = useParams()
  const [company, setCompany] = useState<Company | undefined>()
  const [companyJobs, setCompanyJobs] = useState<Job[]>([])

  useEffect(() => {
    if (!companyId) return

    const companyResult = companyService.getCompanyById(companyId)
    setCompany(companyResult)

    void jobService.getAllJobs({ companyId, limit: 50 }).then((jobs) => {
      setCompanyJobs(jobs)
    })
  }, [companyId])

  if (!company) {
    return (
      <section className="page-shell">
        <div className="container narrow-container">
          <h1>Company not found</h1>
          <Link to="/companies" className="button button-primary">Back to companies</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="page-shell">
      <div className="container company-detail-page">
        <div className="company-hero">
          <div className="company-avatar company-avatar-large">{company.logo}</div>
          <div>
            <span className="eyebrow">{company.industry}</span>
            <h1>{company.name}</h1>
            <div className="info-row">
              <MapPin size={14} />
              <span>{company.location}</span>
            </div>
          </div>
        </div>

        <div className="company-overview">
          <div className="company-details-card">
            <h2>Company overview</h2>
            <p>{company.description}</p>
            <div className="company-detail-stats">
              <span><Building2 size={14} /> Founded {company.founded}</span>
              <span><Users size={14} /> {company.size}</span>
            </div>
            <div className="skill-tags">
              {company.specialities.map((item) => (
                <span key={item} className="skill-tag">{item}</span>
              ))}
            </div>
          </div>

          <div className="company-details-card">
            <h2>Open positions</h2>
            <ul className="company-job-list">
              {companyJobs.map((job) => (
                <li key={job.id}>
                  <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                  <span>{job.location}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
