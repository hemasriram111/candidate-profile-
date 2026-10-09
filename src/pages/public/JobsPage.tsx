import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { JobCard } from '../../components/jobs/JobCard'
import { JobSearchBar } from '../../components/jobs/JobSearchBar'
import { jobService } from '../../services/jobService'
import type { JobPage } from '../../types/job.types'

const PAGE_SIZE = 20

export function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [query, setQuery] = useState(searchParams.get('query') ?? '')
  const [location, setLocation] = useState(searchParams.get('location') ?? '')
  const [workMode, setWorkMode] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [experience, setExperience] = useState('')
  const [salaryRange, setSalaryRange] = useState('')
  const [sort, setSort] = useState<'relevance' | 'newest' | 'salary'>('relevance')
  const [filters, setFilters] = useState<{ query: string; location: string; workMode: string; employmentType: string; experience: string; salaryRange: string; sort: 'relevance' | 'newest' | 'salary' }>({ query: searchParams.get('query') ?? '', location: searchParams.get('location') ?? '', workMode: '', employmentType: '', experience: '', salaryRange: '', sort: 'relevance' })
  const [page, setPage] = useState(1)
  const [results, setResults] = useState<JobPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    const [salaryMin, salaryMax] = filters.salaryRange ? filters.salaryRange.split('-').map(Number) : []
    const experienceBounds = filters.experience === '5+'
      ? [5, undefined]
      : filters.experience ? filters.experience.split('-').map(Number) : []
    const [experienceMin, experienceMax] = experienceBounds
    void jobService.searchJobs({
      search: filters.query || undefined,
      location: filters.location || undefined,
      workMode: filters.workMode || undefined,
      employmentType: filters.employmentType || undefined,
      experienceMin,
      experienceMax,
      salaryMin,
      salaryMax,
      page,
      limit: PAGE_SIZE,
      sort: filters.sort,
    }).then((response) => {
      if (!active) return
      setResults(response)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setError('Unable to load jobs.')
      setLoading(false)
    })
    return () => { active = false }
  }, [filters, page, retry])

  const handleSearch = () => {
    setLoading(true)
    setError('')
    const nextParams = new URLSearchParams()
    if (query.trim()) nextParams.set('query', query.trim())
    if (location.trim()) nextParams.set('location', location.trim())
    setSearchParams(nextParams)
    setPage(1)
    setFilters({ query: query.trim(), location: location.trim(), workMode, employmentType, experience, salaryRange, sort })
  }

  const clearFilters = () => {
    setLoading(true)
    setError('')
    setQuery('')
    setLocation('')
    setWorkMode('')
    setEmploymentType('')
    setExperience('')
    setSalaryRange('')
    setSort('relevance')
    setPage(1)
    setSearchParams({})
    setFilters({ query: '', location: '', workMode: '', employmentType: '', experience: '', salaryRange: '', sort: 'relevance' })
  }

  return (
    <section className="page-shell">
      <div className="container">
        <div className="page-header compact">
          <div>
            <span className="eyebrow">Search jobs</span>
            <h1>Find your next opportunity</h1>
          </div>
        </div>

        <JobSearchBar
          query={query}
          location={location}
          onQueryChange={setQuery}
          onLocationChange={setLocation}
          onSearch={handleSearch}
          onToggleFilters={() => setShowFilters((value) => !value)}
        />

        {showFilters ? (
          <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm text-slate-600">Work mode
              <select aria-label="Work mode" className="mt-1 w-full rounded-lg border border-slate-200 p-2" value={workMode} onChange={(event) => setWorkMode(event.target.value)}>
                <option value="">Any</option><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option><option value="ONSITE">On-site</option>
              </select>
            </label>
            <label className="text-sm text-slate-600">Employment type
              <select aria-label="Employment type" className="mt-1 w-full rounded-lg border border-slate-200 p-2" value={employmentType} onChange={(event) => setEmploymentType(event.target.value)}>
                <option value="">Any</option><option value="FULL_TIME">Full-time</option><option value="PART_TIME">Part-time</option><option value="CONTRACT">Contract</option><option value="INTERNSHIP">Internship</option><option value="TEMPORARY">Temporary</option>
              </select>
            </label>
            <label className="text-sm text-slate-600">Experience
              <select aria-label="Experience range" className="mt-1 w-full rounded-lg border border-slate-200 p-2" value={experience} onChange={(event) => setExperience(event.target.value)}>
                <option value="">Any</option><option value="0-2">0–2 years</option><option value="2-5">2–5 years</option><option value="5+">5+ years</option>
              </select>
            </label>
            <label className="text-sm text-slate-600">Salary
              <select aria-label="Salary range" className="mt-1 w-full rounded-lg border border-slate-200 p-2" value={salaryRange} onChange={(event) => setSalaryRange(event.target.value)}>
                <option value="">Any</option><option value="700000-1200000">₹7–12 LPA</option><option value="1000000-1600000">₹10–16 LPA</option><option value="1500000-2200000">₹15–22 LPA</option>
              </select>
            </label>
            <label className="text-sm text-slate-600">Sort
              <select aria-label="Sort jobs" className="mt-1 w-full rounded-lg border border-slate-200 p-2" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
                <option value="relevance">Relevance</option><option value="newest">Newest</option><option value="salary">Highest salary</option>
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button type="button" className="button button-primary" onClick={handleSearch}>Apply filters</button>
              <button type="button" className="button button-secondary" onClick={clearFilters}>Clear</button>
            </div>
          </div>
        ) : null}

        <div className="jobs-page-layout">
          <div className="jobs-results">
            <div className="results-header">
              <h2>{loading ? 'Searching jobs…' : `${(results?.total ?? 0).toLocaleString()} opportunities`}</h2>
              <select aria-label="Sort jobs" value={sort} onChange={(event) => { setLoading(true); setError(''); setSort(event.target.value as typeof sort); setFilters((current) => ({ ...current, sort: event.target.value as typeof sort })); setPage(1) }}>
                <option value="relevance">Relevance</option><option value="newest">Newest</option><option value="salary">Highest salary</option>
              </select>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2" aria-label="Loading jobs">
                {[1, 2, 3, 4].map((item) => <div key={item} className="h-60 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}
              </div>
            ) : error ? (
              <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                {error} <button type="button" className="ml-2 font-semibold underline" onClick={() => { setLoading(true); setError(''); setRetry((value) => value + 1) }}>Retry</button>
              </div>
            ) : !results?.items.length ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
                No jobs found. Try broadening your search or clear filters.
                <button type="button" className="ml-2 font-semibold text-orange-700 underline" onClick={clearFilters}>Clear filters</button>
              </div>
            ) : (
              <>
                <div className="job-grid three-column">
                  {results.items.map((job) => <JobCard key={job.id} job={job} />)}
                </div>
                {results.totalPages > 1 ? (
                  <nav aria-label="Job search pages" className="mt-5 flex items-center justify-between">
                    <button type="button" className="button button-secondary" disabled={page <= 1} onClick={() => { setLoading(true); setPage((current) => current - 1) }}>Previous</button>
                    <span className="text-sm text-slate-600">Page {results.page} of {results.totalPages}</span>
                    <button type="button" className="button button-secondary" disabled={page >= results.totalPages} onClick={() => { setLoading(true); setPage((current) => current + 1) }}>Next</button>
                  </nav>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
