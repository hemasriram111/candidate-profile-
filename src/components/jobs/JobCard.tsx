import { ArrowRight, BriefcaseBusiness, Clock3, MapPin, Save, Star, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Job } from '../../types/job.types'

type JobCardProps = {
  job: Job
  saved?: boolean
  onToggleSave?: (jobId: string) => void
}

export function JobCard({ job, saved = false, onToggleSave }: JobCardProps) {
  return (
    <article className="job-card">
      <div className="job-card-top">
        <div className="company-avatar" aria-label={`${job.companyName} company logo`}>
          {job.companyLogo}
        </div>
        {onToggleSave ? (
          <button
            type="button"
            className={`save-button ${saved ? 'saved' : ''}`}
            aria-label={saved ? 'Remove job from saved list' : 'Save job'}
            onClick={() => onToggleSave(job.id)}
          >
            <Save size={16} />
          </button>
        ) : null}
      </div>

      <div className="job-card-body">
        <div className="job-meta-row">
          <span className="job-type-tag">{job.employmentType}</span>
          <span className="job-time"><Clock3 size={12} /> {job.postedAt}</span>
        </div>

        <h3>{job.title}</h3>
        <p className="company-line">{job.companyName}</p>

        <div className="job-point-list">
          <span><MapPin size={14} />{job.location}</span>
          <span><BriefcaseBusiness size={14} />{job.workMode}</span>
        </div>

        <div className="job-point-list compact-row">
          <span><Star size={14} />{job.experience}</span>
          <span><Wallet size={14} />{job.salary}</span>
        </div>

        {job.match ? (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
            <p className="text-sm font-semibold">{job.match.score}% match</p>
            {job.match.reasons.length > 0 ? <p className="mt-1 text-xs">{job.match.reasons.slice(0, 3).join(' · ')}</p> : null}
          </div>
        ) : null}

        <div className="skill-tags">
          {job.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="skill-tag">{skill}</span>
          ))}
        </div>
      </div>

      <div className="job-card-footer">
        <Link to={`/jobs/${job.id}`} className="button button-primary button-small wide-button">
          View Job <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  )
}
