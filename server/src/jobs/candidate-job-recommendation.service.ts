import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import {
  CandidateJobSignals,
  ScorableJob,
  combinedCandidateSearchScore,
  scoreJobMatch,
  scoreKeywordRelevance,
} from './job-matching'

function property(value: Prisma.JsonValue | null | undefined, key: string): Prisma.JsonValue | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value[key] : undefined
}

function jsonStrings(value: Prisma.JsonValue | undefined) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function jsonString(value: Prisma.JsonValue | undefined) {
  return typeof value === 'string' ? value : null
}

@Injectable()
export class CandidateJobRecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  private async getCandidateSignals(userId: string): Promise<CandidateJobSignals> {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      select: {
        location: true,
        currentJobTitle: true,
        totalExperienceYears: true,
        totalExperienceMonths: true,
        careerLevel: true,
        parsedResumeData: true,
        skills: true,
        skillsNormalized: { select: { skillName: true, normalizedName: true } },
        education: { select: { degree: true, fieldOfStudy: true } },
        experience: { select: { jobTitle: true } },
        jobPreference: true,
      },
    })

    const preference = profile?.jobPreference
    const parsedResume = profile?.parsedResumeData
    const parsedPersonal = property(parsedResume, 'personal')
    const parsedSkills = jsonStrings(property(parsedResume, 'skills'))
    const legacySkills = Array.isArray(profile?.skills)
      ? profile.skills.filter((value): value is string => typeof value === 'string')
      : []
    const skillMap = new Map<string, { skillName: string; normalizedName: string }>()
    for (const skill of [
      ...(profile?.skillsNormalized ?? []).map((item) => item.skillName),
      ...legacySkills,
      ...parsedSkills,
    ]) {
      const normalizedName = skill.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US')
      if (normalizedName) skillMap.set(normalizedName, { skillName: skill, normalizedName })
    }
    const parsedExperiences = property(parsedResume, 'experience')
    const resumeExperienceTitles = Array.isArray(parsedExperiences)
      ? parsedExperiences.flatMap((item) => {
        const title = jsonString(property(item, 'jobTitle')) ?? jsonString(property(item, 'title'))
        return title ? [{ jobTitle: title }] : []
      })
      : []
    const parsedEducation = property(parsedResume, 'education')
    const resumeEducation = Array.isArray(parsedEducation)
      ? parsedEducation.flatMap((item) => {
        const degree = jsonString(property(item, 'degree')) ?? jsonString(property(item, 'qualification'))
        const fieldOfStudy = jsonString(property(item, 'fieldOfStudy')) ?? jsonString(property(item, 'field'))
        return degree ? [{ degree, fieldOfStudy }] : []
      })
      : []
    return {
      location: profile?.location ?? jsonString(property(parsedPersonal, 'location')),
      currentJobTitle: profile?.currentJobTitle ?? null,
      totalExperienceYears: profile?.totalExperienceYears ?? null,
      totalExperienceMonths: profile?.totalExperienceMonths ?? null,
      careerLevel: profile?.careerLevel ?? null,
      skills: [...skillMap.values()],
      education: [...(profile?.education ?? []), ...resumeEducation],
      experience: [...(profile?.experience ?? []), ...resumeExperienceTitles],
      jobPreference: preference ? {
        desiredTitles: preference.desiredTitles,
        preferredLocations: preference.preferredLocations,
        workModes: preference.workModes,
        employmentTypes: preference.employmentTypes,
        preferredIndustries: preference.preferredIndustries,
        preferredFunctionalAreas: preference.preferredFunctionalAreas,
        experienceMinYears: preference.experienceMinYears == null ? null : Number(preference.experienceMinYears),
        experienceMaxYears: preference.experienceMaxYears == null ? null : Number(preference.experienceMaxYears),
        expectedSalaryMin: preference.expectedSalaryMin,
        expectedSalaryMax: preference.expectedSalaryMax,
      } : null,
    }
  }

  async rankJobs(userId: string, jobs: ScorableJob[], search = '') {
    const candidate = await this.getCandidateSignals(userId)
    const hasQuery = Boolean(search.trim())

    return jobs
      .map((job) => {
        const match = scoreJobMatch(candidate, job)
        const keywordScore = scoreKeywordRelevance(job, search)
        return {
          job,
          match,
          rankingScore: combinedCandidateSearchScore(match, keywordScore, hasQuery),
        }
      })
      .sort((left, right) => right.rankingScore - left.rankingScore
        || right.job.postedAt.getTime() - left.job.postedAt.getTime()
        || left.job.id.localeCompare(right.job.id))
  }

  async recommend(userId: string, jobs: ScorableJob[]) {
    return this.rankJobs(userId, jobs)
  }
}
