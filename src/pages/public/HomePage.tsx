import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CategoryCard } from '../../components/categories/CategoryCard'
import { Hero } from '../../components/hero/Hero'
import { JobCard } from '../../components/jobs/JobCard'
import { SectionHeader } from '../../components/common/SectionHeader'
import { AICareerSection } from '../../components/sections/AICareerSection'
import { ApplicationTrackerSection } from '../../components/sections/ApplicationTrackerSection'
import { CandidateCTA } from '../../components/sections/CandidateCTA'
import { FAQSection } from '../../components/sections/FAQSection'
import { MatchFlowSection } from '../../components/sections/MatchFlowSection'
import { ResourcesSection } from '../../components/sections/ResourcesSection'
import { StatsSection } from '../../components/sections/StatsSection'
import { mockCategories } from '../../data/mock/mockCategories'
import { jobService } from '../../services/jobService'
import type { Job } from '../../types/job.types'

export function HomePage() {
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [jobsError, setJobsError] = useState('')
  const featuredCategories = mockCategories.slice(0, 8)

  useEffect(() => {
    let active = true
    void jobService.getFeaturedJobs().then((jobs) => {
      if (!active) return
      setFeaturedJobs(jobs)
      setJobsLoading(false)
    }).catch(() => {
      if (!active) return
      setJobsError('Featured jobs are temporarily unavailable.')
      setJobsLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <Hero />

      <section className="section-space neutral-bg">
        <div className="container">
          <SectionHeader
            eyebrow="Open roles"
            title="Roles with clear scope and real hiring teams"
            description="A shortlist of current openings from operators, product teams and platform companies hiring now."
          />
          {featuredJobs.length > 0 ? (
            <div className="home-job-marquee" aria-label="Featured open roles">
              <div className="home-job-marquee-track">
                {[false, true].map((isDuplicate) => (
                  <div key={String(isDuplicate)} className="home-job-marquee-group" aria-hidden={isDuplicate || undefined} inert={isDuplicate}>
                    {featuredJobs.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p role={jobsError ? 'alert' : undefined} className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              {jobsLoading ? 'Loading open roles…' : jobsError || 'No open roles are available right now.'}
            </p>
          )}
          <div className="section-link-row">
            <Link to="/jobs" className="text-link">
              See all openings <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section-space neutral-bg alt-section">
        <div className="container">
          <SectionHeader
            eyebrow="Popular categories"
            title="Browse by role type"
          />
          <div className="category-marquee" aria-label="Browse job categories">
            <div className="category-marquee-track">
              {[false, true].map((isDuplicate) => (
                <div key={String(isDuplicate)} className="category-marquee-group" aria-hidden={isDuplicate || undefined} inert={isDuplicate}>
                  {featuredCategories.map((category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <StatsSection />
      <MatchFlowSection />
      <AICareerSection />
      <ApplicationTrackerSection />
      <ResourcesSection />
      <CandidateCTA />
      <FAQSection />
    </>
  )
}
