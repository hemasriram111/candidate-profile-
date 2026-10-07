import { useEffect, useState } from 'react'
import { BriefcaseBusiness, Building2, CheckCircle2, Clock3, MapPin, Wallet } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { JobCard } from '../../components/jobs/JobCard'
import { jobService } from '../../services/jobService'
import type { Job } from '../../types/job.types'

export function JobDetailPage() {
  const { jobId } = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [similarJobs, setSimilarJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!jobId) {
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError('')

    Promise.all([
      jobService.getJobById(jobId),
      jobService.getSimilarJobs(jobId),
    ]).then(([jobResult, similarResult]) => {
      if (!active) return
      setJob(jobResult ?? null)
      setSimilarJobs(similarResult)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setError('We could not load this role right now.')
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [jobId])

  if (loading) {
    return <section className="page-shell"><div className="container narrow-container"><h1>Loading job details…</h1></div></section>
  }

  if (error || !job) {
    return (
      <section className="page-shell">
        <div className="container narrow-container">
          <h1>Job not found</h1>
          <Link to="/jobs" className="button button-primary">Back to jobs</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="page-shell">
      <div className="container job-detail-page">
        <div className="job-detail-header">
          <div className="company-avatar company-avatar-large">{job.companyLogo}</div>
          <div>
            <span className="eyebrow">{job.companyName}</span>
            <h1>{job.title}</h1>
            <div className="job-point-list compact-row">
              <span><MapPin size={14} />{job.location}</span>
              <span><BriefcaseBusiness size={14} />{job.workMode}</span>
              <span><Clock3 size={14} />{job.employmentType}</span>
            </div>
          </div>
        </div>

        <div className="job-detail-layout">
          <div className="job-detail-main">
            <div className="job-summary-card">
              <div className="summary-meta">
                <span><Building2 size={14} /> {job.experience}</span>
                <span><Wallet size={14} /> {job.salary}</span>
              </div>
              <div className="cta-actions detail-actions">
                <button type="button" className="button button-primary">Apply Now</button>
                <button type="button" className="button button-secondary">Save Job</button>
              </div>
            </div>

            <div className="detail-section">
              <h2>About the role</h2>
              <p>{job.description}</p>
            </div>

            {job.responsibilities.length ? <div className="detail-section">
              <h2>Responsibilities</h2>
              <ul className="check-list">
                {job.responsibilities.map((item) => (
                  <li key={item}><CheckCircle2 size={16} /> {item}</li>
                ))}
              </ul>
            </div> : null}

            {job.requirements.length ? <div className="detail-section">
              <h2>Requirements</h2>
              <ul className="check-list">
                {job.requirements.map((item) => (
                  <li key={item}><CheckCircle2 size={16} /> {item}</li>
                ))}
              </ul>
            </div> : null}

            <div className="detail-section">
              <h2>Skills</h2>
              <div className="skill-tags">
                {job.skills.map((skill) => (
                  <span key={skill} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>

            {job.benefits.length ? <div className="detail-section">
              <h2>Benefits</h2>
              <ul className="check-list">
                {job.benefits.map((item) => (
                  <li key={item}><CheckCircle2 size={16} /> {item}</li>
                ))}
              </ul>
            </div> : null}
          </div>

          <aside className="detail-sidecard">
            <h3>Company</h3>
            <p>{job.companyName}</p>
            <Link to={`/companies/${job.companyId}`} className="inline-flex text-sm font-semibold text-orange-800 hover:underline">View company profile</Link>
            <div className="side-metrics">
              <span>Location: {job.location}</span>
              <span>Work mode: {job.workMode}</span>
              <span>Experience: {job.experience}</span>
            </div>
          </aside>
        </div>

        <div className="similar-section">
          <h2>More open jobs</h2>
          <div className="job-grid three-column">
            {similarJobs.map((similarJob) => (
              <JobCard key={similarJob.id} job={similarJob} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
