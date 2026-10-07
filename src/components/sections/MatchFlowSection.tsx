import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, BriefcaseBusiness, CheckCheck, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SectionHeader } from '../common/SectionHeader'
import { jobService } from '../../services/jobService'
import type { Job } from '../../types/job.types'

export function MatchFlowSection() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    let active = true
    void jobService.getFeaturedJobs().then((currentJobs) => {
      if (!active) return
      setJobs(currentJobs)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setLoadError(true)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (reduceMotion || jobs.length < 2) return
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % jobs.length)
    }, 4200)

    return () => window.clearInterval(intervalId)
  }, [jobs.length, reduceMotion])

  const job = jobs[activeIndex]

  return (
    <section className="section-space">
      <div className="container">
        <SectionHeader
          eyebrow="Matching engine"
          title="Your profile connects to the right roles."
          description="Clyptus ranks opportunities using your skills, preferred roles, location, and work preferences."
        />

        <div className="match-flow-content">
            <div className="match-flow-wrap">
              <motion.div
                className="match-node"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45 }}
              >
                <div className="match-icon-wrap match-icon-primary"><UserRound size={18} /></div>
                <div>
                  <p className="match-label">Candidate profile</p>
                  <p className="match-value">Skills, experience, preferences</p>
                </div>
              </motion.div>

              <div className="match-pipeline-line" aria-hidden="true" />

              <motion.div
                className="match-node"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.08 }}
              >
                <div className="match-icon-wrap match-icon-accent"><CheckCheck size={18} /></div>
                <div>
                  <p className="match-label">Fit model</p>
                  <p className="match-value">Skills, role, location, and preference fit</p>
                </div>
              </motion.div>

              <div className="match-pipeline-line" aria-hidden="true" />

              <motion.div
                className="match-node"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, delay: 0.16 }}
              >
                <div className="match-icon-wrap match-icon-neutral"><BriefcaseBusiness size={18} /></div>
                <div>
                  <p className="match-label">Recommended jobs</p>
                  <p className="match-value">Prioritized roles that fit your next move</p>
                </div>
              </motion.div>
            </div>

            <div className="match-recommendation" aria-live="polite" aria-atomic="true">
              {job ? (
              <AnimatePresence mode="wait" initial={false}>
                <motion.article
                  key={job.id}
                  className="match-recommendation-card"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
                  transition={{ duration: reduceMotion ? 0 : 0.3 }}
                >
                  <div className="match-recommendation-header">
                    <span>Current opening</span>
                    <strong>{job.workMode} · {job.employmentType}</strong>
                  </div>
                  <h3>{job.title}</h3>
                  <p className="match-recommendation-company">{job.companyName} · {job.location}</p>
                  <p className="match-recommendation-description">{job.description}</p>
                  <div className="match-recommendation-skills">
                    {job.skills.slice(0, 3).map((skill) => <span key={skill}>{skill}</span>)}
                  </div>
                </motion.article>
              </AnimatePresence>
              ) : (
                <p role={loadError ? 'alert' : undefined} className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                  {loadError ? 'Current openings are temporarily unavailable.' : loading ? 'Loading current openings…' : 'No current openings are available.'}
                </p>
              )}
            </div>

            <div className="match-actions-row">
              <Link to="/jobs" className="button button-primary">Explore roles</Link>
              <Link to="/candidate/profile" className="button button-secondary">
                Improve my profile <ArrowRight size={14} />
              </Link>
            </div>
        </div>
      </div>
    </section>
  )
}
