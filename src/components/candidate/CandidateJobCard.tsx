import { ArrowRight, Bookmark, Building2, Clock3, MapPin } from 'lucide-react'
import { Button } from '../../components/ui/button'
import type { JobRecord } from '../../types/candidate.types'

type CandidateJobCardProps = {
  job?: Partial<JobRecord>
  saved?: boolean
  onToggleSave?: () => void
  saving?: boolean
  onView?: () => void
}

export function CandidateJobCard({ job, saved = false, onToggleSave, saving = false, onView }: CandidateJobCardProps) {
  const title = job?.title || 'Role title unavailable'
  const company = job?.company || 'Company name pending'
  const location = job?.location || 'Location to be added'
  const workMode = job?.workMode || 'Flexible'
  const employmentType = job?.employmentType || 'Full-time'
  const salary = job?.salary || 'Salary details pending'
  const skills = job?.skills && job.skills.length > 0 ? job.skills : ['Add required skills']
  const postedDate = job?.postedDate || 'Date pending'

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-primary)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">{company}</p>
            <h3 className="mt-1 text-xl font-semibold text-[var(--color-text)]">{title}</h3>
          </div>
        </div>
        {onToggleSave ? (
          <Button
            type="button"
            variant={saved ? 'default' : 'outline'}
            size="sm"
            className={saved ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]' : ''}
            disabled={saving}
            aria-pressed={saved}
            onClick={onToggleSave}
          >
            <Bookmark className="h-4 w-4" />
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
          </Button>
        ) : null}
      </div>

      {job?.match ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
          <p className="text-sm font-semibold text-emerald-800">{job.match.score}% match</p>
          {job.match.reasons.length > 0 ? (
            <p className="mt-1 text-xs text-emerald-800">Matches: {job.match.reasons.slice(0, 4).join(' · ')}</p>
          ) : null}
          {job.match.missingSkills.length > 0 ? (
            <p className="mt-1 text-xs text-slate-600">Skills not listed: {job.match.missingSkills.slice(0, 3).join(' · ')}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--color-text-secondary)]">
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1">
          <MapPin className="h-3.5 w-3.5" />
          {location}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1">{workMode}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1">{employmentType}</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-[var(--color-text-secondary)]">
        <div className="font-medium text-[var(--color-text)]">{salary}</div>
        <div className="inline-flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5" />
          {postedDate}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {skills.slice(0, 3).map((skill) => (
          <span key={skill} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <Button onClick={onView}>
          View job
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </article>
  )
}
