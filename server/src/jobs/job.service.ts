import { Injectable, NotFoundException } from '@nestjs/common'
import { Company, EmploymentType, Job, JobStatus, WorkMode } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CandidateJobRecommendationService } from './candidate-job-recommendation.service'
import { JobQueryDto } from './dto/job-query.dto'
import { ScorableJob, scoreKeywordRelevance } from './job-matching'

type JobWithCompany = Job & { company: Pick<Company, 'name'> }

const workModeMap: Record<WorkMode, 'Remote' | 'Hybrid' | 'On-site'> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
}

const employmentTypeMap: Record<EmploymentType, 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Temporary'> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  TEMPORARY: 'Temporary',
}

function formatIndianCurrency(value: number) {
  if (value >= 100000) {
    const lakhs = value / 100000
    return Number.isInteger(lakhs) ? `₹${lakhs}L` : `₹${lakhs.toFixed(1)}L`
  }
  return `₹${Math.round(value / 1000)}K`
}

function formatSalaryRange(min?: number | null, max?: number | null) {
  if (min == null && max == null) return 'Competitive'
  if (min != null && max != null && min === max) return formatIndianCurrency(min)
  const start = min ?? max ?? 0
  const end = max ?? min ?? 0
  return `${formatIndianCurrency(start)} - ${formatIndianCurrency(end)}`
}

function formatExperience(min?: number | null, max?: number | null) {
  if (min == null && max == null) return 'Not specified'
  if (min != null && max != null && min === max) return `${min}+ years`
  const start = min ?? 0
  const end = max ?? start
  return `${start}-${end} years`
}

function formatRelativeDate(date: Date) {
  const diffDays = Math.max(0, Math.ceil((Date.now() - new Date(date).getTime()) / 86_400_000))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

function toCompanyInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? '')
    .join('') || 'C'
}

export function serializeJob(job: JobWithCompany) {
  const skillList = Array.isArray(job.skills) ? job.skills : []
  const category = job.industry ?? 'Technology'

  return {
    id: job.id,
    title: job.title,
    companyId: job.companyId,
    companyName: job.company.name,
    companyLogo: toCompanyInitials(job.company.name),
    location: job.location,
    workMode: workModeMap[job.workMode],
    employmentType: employmentTypeMap[job.employmentType],
    experience: formatExperience(job.experienceMin, job.experienceMax),
    salary: formatSalaryRange(job.salaryMin, job.salaryMax),
    skills: skillList,
    postedAt: formatRelativeDate(job.postedAt),
    description: job.description,
    responsibilities: [],
    requirements: [],
    benefits: [],
    category,
  }
}

@Injectable()
export class JobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recommendations: CandidateJobRecommendationService,
  ) {}

  private buildWhere(dto: JobQueryDto, userId?: string): Prisma.JobWhereInput {
    const search = dto.search?.trim()
    const skills = dto.skills ?? []
    const searchTerms = search?.split(/\s+/).filter(Boolean) ?? []
    const industry = dto.industry?.trim() || dto.category?.trim()
    const searchConditions: Prisma.JobWhereInput[] = searchTerms.flatMap((term) => {
      const titleCase = term.charAt(0).toLocaleUpperCase('en-US') + term.slice(1).toLocaleLowerCase('en-US')
      const variants = [...new Set([term, term.toLocaleLowerCase('en-US'), titleCase, term.toLocaleUpperCase('en-US')])]
      return [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { industry: { contains: term, mode: 'insensitive' } },
        { company: { name: { contains: term, mode: 'insensitive' } } },
        { skills: { hasSome: variants } },
      ]
    })

    return {
      status: JobStatus.OPEN,
      ...(searchConditions.length > 0 ? { OR: searchConditions } : {}),
      ...(dto.location?.trim() ? { location: { contains: dto.location.trim(), mode: 'insensitive' } } : {}),
      ...(industry ? { industry: { contains: industry, mode: 'insensitive' } } : {}),
      ...(dto.companyId ? { companyId: dto.companyId } : {}),
      ...(dto.workMode ? { workMode: dto.workMode } : {}),
      ...(dto.employmentType ? { employmentType: dto.employmentType } : {}),
      ...(dto.experienceMin !== undefined ? { experienceMax: { gte: dto.experienceMin } } : {}),
      ...(dto.experienceMax !== undefined ? { experienceMin: { lte: dto.experienceMax } } : {}),
      ...(dto.salaryMin !== undefined ? { salaryMax: { gte: dto.salaryMin } } : {}),
      ...(dto.salaryMax !== undefined ? { salaryMin: { lte: dto.salaryMax } } : {}),
      ...(skills.length > 0 ? { skills: { hasSome: skills } } : {}),
      ...(userId ? { applications: { none: { userId } } } : {}),
    }
  }

  async listJobs(dto: JobQueryDto, candidateUserId?: string) {
    const page = dto.page ?? 1
    const limit = dto.limit ?? 20
    const skip = (page - 1) * limit
    const sort = dto.sort ?? 'relevance'
    const where = this.buildWhere(dto)
    const [total, jobs] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        include: { company: true },
        ...(sort === 'newest'
          ? { orderBy: [{ postedAt: 'desc' as const }, { id: 'asc' as const }] }
          : sort === 'salary'
            ? { orderBy: [{ salaryMax: { sort: 'desc' as const, nulls: 'last' as const } }, { postedAt: 'desc' as const }, { id: 'asc' as const }] }
            : {}),
        ...(sort !== 'relevance' ? { skip, take: limit } : {}),
      }),
    ])

    let items: Array<Record<string, unknown>>
    if (candidateUserId && sort === 'relevance') {
      const ranked = await this.recommendations.rankJobs(candidateUserId, jobs as ScorableJob[], dto.search ?? '')
      items = ranked.slice(skip, skip + limit).map(({ job, match }) => ({
        ...serializeJob(job),
        match: {
          score: match.score,
          reasons: match.reasons,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
        },
      }))
    } else if (sort === 'relevance') {
      items = (jobs as ScorableJob[])
        .map((job) => ({ job, score: scoreKeywordRelevance(job, dto.search ?? '') }))
        .sort((left, right) => right.score - left.score
          || right.job.postedAt.getTime() - left.job.postedAt.getTime()
          || left.job.id.localeCompare(right.job.id))
        .slice(skip, skip + limit)
        .map(({ job }) => serializeJob(job))
    } else if (candidateUserId) {
      const ranked = await this.recommendations.rankJobs(candidateUserId, jobs as ScorableJob[])
      items = ranked.map(({ job, match }) => ({
        ...serializeJob(job),
        match: {
          score: match.score,
          reasons: match.reasons,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
        },
      }))
    } else {
      items = jobs.map((job) => serializeJob(job as JobWithCompany))
    }

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  }

  async listRecommendedJobs(userId: string, dto: JobQueryDto) {
    const page = dto.page ?? 1
    const limit = dto.limit ?? 20
    const skip = (page - 1) * limit
    const where = this.buildWhere(dto, userId)
    const [total, jobs] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({ where, include: { company: true }, orderBy: { postedAt: 'desc' } }),
    ])
    const sort = dto.sort ?? 'relevance'
    const ranked = sort === 'newest'
      ? jobs.map((job) => ({ job, match: null })).sort((left, right) => right.job.postedAt.getTime() - left.job.postedAt.getTime() || left.job.id.localeCompare(right.job.id))
      : sort === 'salary'
        ? jobs.map((job) => ({ job, match: null })).sort((left, right) => (right.job.salaryMax ?? -1) - (left.job.salaryMax ?? -1)
          || right.job.postedAt.getTime() - left.job.postedAt.getTime()
          || left.job.id.localeCompare(right.job.id))
        : await this.recommendations.recommend(userId, jobs as ScorableJob[])

    const items = ranked.slice(skip, skip + limit).map(({ job, match }) => ({
      ...serializeJob(job as JobWithCompany),
      ...(match ? {
        match: {
          score: match.score,
          reasons: match.reasons,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
        },
      } : {}),
    }))

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) }
  }

  async getJobById(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { company: true },
    })

    if (!job) {
      throw new NotFoundException('Job not found.')
    }

    return serializeJob(job as JobWithCompany)
  }
}
