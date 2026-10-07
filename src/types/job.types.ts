export type JobMode = 'Remote' | 'Hybrid' | 'On-site'
export type JobType = 'Full-time' | 'Contract' | 'Part-time' | 'Internship' | 'Temporary'

export type JobMatch = {
  score: number
  reasons: string[]
  matchedSkills: string[]
  missingSkills: string[]
}

export type JobPage = {
  items: Job[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type Job = {
  id: string
  title: string
  companyId: string
  companyName: string
  companyLogo: string
  location: string
  workMode: JobMode
  employmentType: JobType
  experience: string
  salary: string
  skills: string[]
  postedAt: string
  description: string
  responsibilities: string[]
  requirements: string[]
  benefits: string[]
  category: string
  match?: JobMatch
}
