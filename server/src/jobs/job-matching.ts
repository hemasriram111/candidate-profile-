import { EmploymentType, Job, WorkMode } from '@prisma/client'

export const MATCH_WEIGHTS = {
  skill: 0.3,
  role: 0.17,
  location: 0.12,
  experience: 0.1,
  workMode: 0.09,
  employmentType: 0.05,
  salary: 0.1,
  education: 0.02,
  freshness: 0.05,
} as const

export type CandidateJobSignals = {
  location: string | null
  currentJobTitle: string | null
  totalExperienceYears: number | null
  totalExperienceMonths: number | null
  careerLevel: string | null
  skills: Array<{ skillName: string; normalizedName: string }>
  education: Array<{ degree: string; fieldOfStudy: string | null }>
  experience: Array<{ jobTitle: string }>
  jobPreference: {
    desiredTitles: string[]
    preferredLocations: string[]
    workModes: WorkMode[]
    employmentTypes: EmploymentType[]
    preferredIndustries: string[]
    preferredFunctionalAreas: string[]
    experienceMinYears: number | null
    experienceMaxYears: number | null
    expectedSalaryMin: number | null
    expectedSalaryMax: number | null
  } | null
}

export type ScorableJob = Job & { company: { name: string } }

export type JobMatch = {
  score: number
  reasons: string[]
  matchedSkills: string[]
  missingSkills: string[]
}

const workModeLabels: Record<WorkMode, string> = {
  [WorkMode.REMOTE]: 'Remote',
  [WorkMode.HYBRID]: 'Hybrid',
  [WorkMode.ONSITE]: 'On-site',
}

function normalize(value: string) {
  return value.normalize('NFKC').trim().replace(/[^\p{L}\p{N}+#.]+/gu, ' ').toLocaleLowerCase('en-US').replace(/\s+/g, ' ')
}

function tokens(value: string) {
  return normalize(value).split(' ').filter((token) => token.length > 1)
}

function overlapScore(candidateTerms: string[], jobText: string) {
  if (candidateTerms.length === 0) return 0.5
  const jobTerms = new Set(tokens(jobText))
  const matched = candidateTerms.filter((term) => jobTerms.has(term))
  return matched.length / candidateTerms.length
}

function freshnessScore(postedAt: Date) {
  const ageDays = Math.max(0, (Date.now() - postedAt.getTime()) / 86_400_000)
  if (ageDays <= 7) return 1
  if (ageDays <= 30) return 0.8
  if (ageDays <= 90) return 0.6
  return 0.35
}

function experienceScore(candidate: CandidateJobSignals, job: ScorableJob) {
  const careerLevelYears: Record<string, number> = {
    STUDENT: 0,
    FRESHER: 0,
    ENTRY_LEVEL: 1,
    MID_LEVEL: 4,
    SENIOR: 7,
    LEAD: 9,
    MANAGER: 8,
  }
  const actualYears = candidate.totalExperienceYears == null
    ? null
    : candidate.totalExperienceYears + (candidate.totalExperienceMonths ?? 0) / 12
  const preferenceYears = candidate.jobPreference?.experienceMaxYears
    ?? candidate.jobPreference?.experienceMinYears
  const years = actualYears ?? preferenceYears ?? (candidate.careerLevel ? careerLevelYears[candidate.careerLevel] ?? null : null)
  if (years == null || (job.experienceMin == null && job.experienceMax == null)) return 0.5
  if (job.experienceMin != null && years < job.experienceMin) {
    return Math.max(0.05, 1 - (job.experienceMin - years) * 0.22)
  }
  if (job.experienceMax != null && years > job.experienceMax) {
    return Math.max(0.35, 1 - (years - job.experienceMax) * 0.08)
  }
  return 1
}

function salaryScore(candidate: CandidateJobSignals, job: ScorableJob) {
  const preference = candidate.jobPreference
  if (preference?.expectedSalaryMin == null && preference?.expectedSalaryMax == null) return 0.5
  if (job.salaryMin == null && job.salaryMax == null) return 0.6

  const candidateMin = preference?.expectedSalaryMin ?? preference?.expectedSalaryMax
  const candidateMax = preference?.expectedSalaryMax ?? preference?.expectedSalaryMin
  const jobMin = job.salaryMin ?? job.salaryMax
  const jobMax = job.salaryMax ?? job.salaryMin
  if (candidateMin == null || candidateMax == null || jobMin == null || jobMax == null) return 0.6
  if (candidateMin <= jobMax && jobMin <= candidateMax) return 1
  return 0.15
}

function locationScore(candidate: CandidateJobSignals, job: ScorableJob) {
  const locations = candidate.jobPreference?.preferredLocations.length
    ? candidate.jobPreference.preferredLocations
    : candidate.location ? [candidate.location] : []
  if (locations.length === 0) return 0.5
  const normalizedJobLocation = normalize(job.location)
  if (locations.some((location) => normalize(location) === normalizedJobLocation)) return 1
  if (job.workMode === WorkMode.REMOTE || normalizedJobLocation.includes('remote')) return 0.75
  if (locations.some((location) => normalizedJobLocation.includes(normalize(location)))) return 1
  return 0.1
}

function locationReason(candidate: CandidateJobSignals, job: ScorableJob) {
  const locations = candidate.jobPreference?.preferredLocations.length
    ? candidate.jobPreference.preferredLocations
    : candidate.location ? [candidate.location] : []
  const normalizedJobLocation = normalize(job.location)
  if (locations.some((location) => normalize(location) === normalizedJobLocation || normalizedJobLocation.includes(normalize(location)))) {
    return job.location
  }
  if (job.workMode === WorkMode.REMOTE) return 'Remote role'
  return null
}

function modeScore(candidate: CandidateJobSignals, job: ScorableJob) {
  const modes = candidate.jobPreference?.workModes ?? []
  if (modes.length === 0) return 0.5
  if (modes.includes(job.workMode)) return 1
  if (modes.includes(WorkMode.HYBRID) && job.workMode === WorkMode.REMOTE) return 0.75
  return 0.15
}

function employmentScore(candidate: CandidateJobSignals, job: ScorableJob) {
  const types = candidate.jobPreference?.employmentTypes ?? []
  if (types.length === 0) return 0.5
  return types.includes(job.employmentType) ? 1 : 0.15
}

function educationScore(candidate: CandidateJobSignals, job: ScorableJob) {
  if (job.education.length === 0 || candidate.education.length === 0) return 0.5
  const candidateEducation = normalize(candidate.education.map((item) => `${item.degree} ${item.fieldOfStudy ?? ''}`).join(' '))
  return job.education.some((requirement) => {
    const requirementTokens = tokens(requirement)
    return requirementTokens.length > 0 && requirementTokens.some((token) => candidateEducation.includes(token))
  }) ? 1 : 0.25
}

export function scoreJobMatch(candidate: CandidateJobSignals, job: ScorableJob): JobMatch {
  const candidateSkills = new Map(candidate.skills.map((skill) => [normalize(skill.normalizedName || skill.skillName), skill.skillName]))
  const jobSkills = Array.isArray(job.skills) ? job.skills : []
  const matchedSkills = jobSkills.filter((skill) => candidateSkills.has(normalize(skill)))
  const missingSkills = jobSkills.filter((skill) => !candidateSkills.has(normalize(skill)))
  const skillScore = jobSkills.length === 0 ? 0.5 : matchedSkills.length / jobSkills.length
  const preferences = candidate.jobPreference
  const roleTitles = [
    ...(preferences?.desiredTitles ?? []),
    ...candidate.experience.map((item) => item.jobTitle),
    ...(candidate.currentJobTitle ? [candidate.currentJobTitle] : []),
  ].filter(Boolean)
  const rolesScore = roleTitles.length === 0
    ? 0.5
    : Math.max(...roleTitles.map((role) => overlapScore(tokens(role), job.title)))
  const preferredIndustries = [
    ...(preferences?.preferredIndustries ?? []),
    ...(preferences?.preferredFunctionalAreas ?? []),
  ]
  const industryScore = preferredIndustries.length === 0 || !job.industry
    ? rolesScore
    : Math.max(rolesScore, ...preferredIndustries.map((industry) => overlapScore(tokens(industry), job.industry ?? '')))
  const candidateLocationTerms = preferences?.preferredLocations ?? (candidate.location ? [candidate.location] : [])
  const locationMatch = locationScore(candidate, job)
  const workModeMatch = modeScore(candidate, job)
  const employmentTypeMatch = employmentScore(candidate, job)
  const yearsMatch = experienceScore(candidate, job)
  const salaryMatch = salaryScore(candidate, job)
  const educationMatch = educationScore(candidate, job)
  const freshnessMatch = freshnessScore(job.postedAt)
  const score =
    skillScore * MATCH_WEIGHTS.skill +
    industryScore * MATCH_WEIGHTS.role +
    locationMatch * MATCH_WEIGHTS.location +
    yearsMatch * MATCH_WEIGHTS.experience +
    workModeMatch * MATCH_WEIGHTS.workMode +
    employmentTypeMatch * MATCH_WEIGHTS.employmentType +
    salaryMatch * MATCH_WEIGHTS.salary +
    educationMatch * MATCH_WEIGHTS.education +
    freshnessMatch * MATCH_WEIGHTS.freshness
  const reasons = [
    ...matchedSkills.slice(0, 4),
    ...(industryScore >= 0.6 && preferredIndustries.length > 0 ? ['Matches your preferred role or industry'] : []),
    ...(rolesScore >= 0.5 && roleTitles.length > 0 ? ['Matches your preferred role'] : []),
    ...(locationMatch >= 0.75 && candidateLocationTerms.length > 0 ? [locationReason(candidate, job)].filter((reason): reason is string => Boolean(reason)) : []),
    ...(workModeMatch >= 0.75 && (preferences?.workModes.length ?? 0) > 0 ? [workModeLabels[job.workMode]] : []),
    ...(employmentTypeMatch === 1 ? ['Matches your employment type preference'] : []),
    ...(salaryMatch === 1 ? ['Within your expected salary range'] : []),
    ...(educationMatch === 1 && job.education.length > 0 ? ['Education matches the role'] : []),
  ]
  return {
    score: Math.round(score * 100),
    reasons: [...new Set(reasons)],
    matchedSkills,
    missingSkills,
  }
}

export function scoreKeywordRelevance(job: ScorableJob, search: string) {
  const terms = tokens(search)
  if (terms.length === 0) return 0
  const title = normalize(job.title)
  const company = normalize(job.company.name)
  const skills = normalize(job.skills.join(' '))
  const description = normalize(`${job.description} ${job.industry ?? ''}`)
  const weights = { title: 0.5, company: 0.15, skills: 0.25, description: 0.1 }
  const fieldScore = (value: string) => terms.filter((term) => value.includes(term)).length / terms.length
  return fieldScore(title) * weights.title
    + fieldScore(company) * weights.company
    + fieldScore(skills) * weights.skills
    + fieldScore(description) * weights.description
}

export function combinedCandidateSearchScore(match: JobMatch, keywordScore: number, hasQuery: boolean) {
  return hasQuery
    ? match.score * 0.75 + keywordScore * 100 * 0.25
    : match.score
}
