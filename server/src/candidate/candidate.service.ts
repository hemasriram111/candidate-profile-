import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { CandidateLinkType, Prisma } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto'

const PROFILE_PHOTO_TYPES: Record<string, { extension: string; signature: (file: Buffer) => boolean }> = {
  'image/jpeg': { extension: 'jpg', signature: (file) => file[0] === 0xff && file[1] === 0xd8 && file[2] === 0xff },
  'image/png': { extension: 'png', signature: (file) => file.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/webp': { extension: 'webp', signature: (file) => file.toString('ascii', 0, 4) === 'RIFF' && file.toString('ascii', 8, 12) === 'WEBP' },
}
const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024

function normalizeName(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US')
}

function uniqueText(values: string[] = []) {
  return [...new Map(values.map((value) => [normalizeName(value), value.trim()])).values()].filter(Boolean)
}

function ensureDateOrder(start?: string | null, end?: string | null, label = 'date') {
  if (start && end && new Date(end).getTime() < new Date(start).getTime()) {
    throw new BadRequestException(`${label} cannot be before its start.`)
  }
}

@Injectable()
export class CandidateService {
  constructor(private readonly prisma: PrismaService) {}

  async createCandidateProfile(userId: string) {
    return this.prisma.candidateProfile.create({
      data: {
        userId,
        headline: 'Candidate Profile',
        location: '',
        bio: '',
        resumeOnboardingComplete: false,
      },
    })
  }

  async getProfile(userId: string) {
    const candidate = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        skillsNormalized: { orderBy: { normalizedName: 'asc' } },
        education: { orderBy: [{ endYear: 'desc' }, { createdAt: 'asc' }] },
        experience: {
          include: { skills: { include: { skill: { select: { id: true, skillName: true } } } } },
          orderBy: [{ currentJob: 'desc' }, { startDate: 'desc' }],
        },
        projects: { orderBy: { createdAt: 'desc' } },
        certifications: { orderBy: { issueDate: 'desc' } },
        languages: { orderBy: { normalizedName: 'asc' } },
        links: { orderBy: { type: 'asc' } },
        jobPreference: true,
      },
    })

    if (!candidate) {
      throw new NotFoundException('Candidate profile was not found.')
    }

    const latestResume = await this.prisma.resume.findFirst({
      where: { userId, status: 'PARSED' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, originalFileName: true, mimeType: true, fileSize: true, status: true, parsedData: true, createdAt: true },
    })
    const latestResumeIsDraft = Boolean(latestResume && latestResume.createdAt > candidate.updatedAt)
    const profileCompletion = this.getProfileCompletion(candidate, Boolean(latestResume))
    const legacySkills = Array.isArray(candidate.skills)
      ? candidate.skills.filter((value): value is string => typeof value === 'string')
      : []

    return {
      user: candidate.user,
      onboardingComplete: candidate.resumeOnboardingComplete,
      profile: {
        id: candidate.id,
        fullName: candidate.user.name,
        email: candidate.user.email,
        phone: candidate.phone,
        gender: candidate.gender,
        dateOfBirth: candidate.dateOfBirth,
        headline: candidate.headline,
        location: candidate.location,
        bio: candidate.bio,
        profilePhotoUrl: candidate.profilePhotoStoredName ? '/api/candidate/profile-photo' : null,
        currentJobTitle: candidate.currentJobTitle,
        currentCompany: candidate.currentCompany,
        totalExperienceYears: candidate.totalExperienceYears,
        totalExperienceMonths: candidate.totalExperienceMonths,
        industry: candidate.industry,
        functionalArea: candidate.functionalArea,
        careerLevel: candidate.careerLevel,
        noticePeriodDays: candidate.noticePeriodDays,
        currentSalary: candidate.currentSalary,
        workAuthorization: candidate.workAuthorization,
        willingToRelocate: candidate.willingToRelocate,
        relocationLocations: candidate.relocationLocations,
        openToWork: candidate.openToWork,
        availability: candidate.availability,
        customNoticePeriodDays: candidate.customNoticePeriodDays,
        visibility: candidate.visibility,
        allowRecruiterContact: candidate.allowRecruiterContact,
        showInRecruiterSearch: candidate.showInRecruiterSearch,
        showResumeToRecruiters: candidate.showResumeToRecruiters,
        skills: candidate.skillsNormalized.length
          ? candidate.skillsNormalized
          : legacySkills.map((skillName) => ({ id: `legacy:${normalizeName(skillName)}`, skillName, proficiency: 'INTERMEDIATE', yearsOfExperience: null })),
        education: candidate.education,
        experience: candidate.experience.map((item) => ({
          ...item,
          skills: item.skills.map((relation) => relation.skill),
        })),
        projects: candidate.projects,
        certifications: candidate.certifications,
        languages: candidate.languages,
        links: candidate.links,
        preferences: candidate.jobPreference,
        parsedResumeData: latestResumeIsDraft
          ? latestResume?.parsedData ?? null
          : candidate.parsedResumeData ?? latestResume?.parsedData ?? null,
        resumeDraftPendingReview: latestResumeIsDraft,
        profileCompletion,
      },
      latestResume,
    }
  }

  private getProfileCompletion(candidate: {
    user: { name: string }
    phone: string | null
    headline: string | null
    location: string | null
    bio: string | null
    skills: Prisma.JsonValue
    skillsNormalized: unknown[]
    education: unknown[]
    experience: unknown[]
    projects: unknown[]
    certifications: unknown[]
    links: unknown[]
    languages: unknown[]
    jobPreference: { desiredTitles: string[]; preferredLocations: string[]; workModes: string[] } | null
  }, hasResume: boolean) {
    const sections = [
      { label: 'Basic details', weight: 20, complete: Boolean(candidate.user.name && candidate.phone && candidate.location) },
      { label: 'Education', weight: 14, complete: candidate.education.length > 0 },
      { label: 'Resume', weight: 14, complete: hasResume },
      { label: 'Professional headline', weight: 10, complete: Boolean(candidate.headline) },
      { label: 'About', weight: 8, complete: Boolean(candidate.bio) },
      { label: 'Add skills', weight: 10, complete: candidate.skillsNormalized.length > 0 || (Array.isArray(candidate.skills) && candidate.skills.length > 0) },
      { label: 'Experience', weight: 6, complete: candidate.experience.length > 0 },
      { label: 'Projects', weight: 4, complete: candidate.projects.length > 0 },
      { label: 'Certifications', weight: 2, complete: candidate.certifications.length > 0 },
      { label: 'Languages', weight: 2, complete: candidate.languages.length > 0 },
    ]
    const profileCompletion = sections.reduce((score, section) => score + (section.complete ? section.weight : 0), 0)
    const preferencesComplete = Boolean(candidate.jobPreference?.desiredTitles.length && candidate.jobPreference.preferredLocations.length && candidate.jobPreference.workModes.length)

    return {
      percentage: Math.min(100, profileCompletion + (preferencesComplete ? 10 : 0)),
      sections: [...sections.map(({ label, complete }) => ({ label, complete })), { label: 'Job preferences', complete: preferencesComplete }],
      missing: [...sections.filter((section) => !section.complete).map((section) => section.label), ...(!preferencesComplete ? ['Job preferences'] : [])],
      preferencesComplete,
    }
  }

  async updateProfile(userId: string, data: UpdateCandidateProfileDto) {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId }, select: { id: true } })
    if (!profile) {
      throw new NotFoundException('Candidate profile was not found.')
    }

    if (data.preferences?.expectedSalaryMin != null && data.preferences.expectedSalaryMax != null && data.preferences.expectedSalaryMax < data.preferences.expectedSalaryMin) {
      throw new BadRequestException('Expected salary cannot be lower than minimum salary.')
    }
    if (data.preferences?.experienceMinYears != null && data.preferences.experienceMaxYears != null && data.preferences.experienceMaxYears < data.preferences.experienceMinYears) {
      throw new BadRequestException('Maximum experience cannot be lower than minimum experience.')
    }
    if (data.dateOfBirth && new Date(data.dateOfBirth).getTime() > Date.now()) {
      throw new BadRequestException('Date of birth cannot be in the future.')
    }
    for (const education of data.education ?? []) {
      if (education.startYear != null && education.endYear != null && education.endYear < education.startYear) {
        throw new BadRequestException('Education end year cannot be before its start year.')
      }
    }
    for (const experience of data.experience ?? []) {
      if (experience.currentJob && experience.endDate) {
        throw new BadRequestException('A current job cannot have an end date.')
      }
      ensureDateOrder(experience.startDate, experience.currentJob ? null : experience.endDate, 'Experience end date')
    }
    for (const project of data.projects ?? []) ensureDateOrder(project.startDate, project.endDate, 'Project end date')
    for (const certification of data.certifications ?? []) ensureDateOrder(certification.issueDate, certification.expiryDate, 'Certification expiry date')
    if (data.availability === 'CUSTOM' && data.customNoticePeriodDays == null) {
      throw new BadRequestException('Enter a custom notice period in days.')
    }

    const cleanedSkills = uniqueText([
      ...(data.skills ?? []).map((skill) => skill.skillName),
      ...(data.experience ?? []).flatMap((experience) => experience.skills ?? []),
    ])

    await this.prisma.$transaction(async (transaction) => {
      await transaction.candidateProfile.update({
        where: { id: profile.id },
        data: {
          phone: data.phone,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth === undefined ? undefined : data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          headline: data.headline,
          location: data.location,
          bio: data.bio,
          currentJobTitle: data.currentJobTitle,
          currentCompany: data.currentCompany,
          totalExperienceYears: data.totalExperienceYears,
          totalExperienceMonths: data.totalExperienceMonths,
          industry: data.industry,
          functionalArea: data.functionalArea,
          careerLevel: data.careerLevel,
          noticePeriodDays: data.noticePeriodDays,
          currentSalary: data.currentSalary,
          workAuthorization: data.workAuthorization,
          willingToRelocate: data.willingToRelocate,
          relocationLocations: data.relocationLocations ? uniqueText(data.relocationLocations) : undefined,
          openToWork: data.openToWork,
          availability: data.availability,
          customNoticePeriodDays: data.customNoticePeriodDays,
          visibility: data.visibility,
          allowRecruiterContact: data.allowRecruiterContact,
          showInRecruiterSearch: data.showInRecruiterSearch,
          showResumeToRecruiters: data.showResumeToRecruiters,
          skills: data.skills !== undefined ? Prisma.DbNull : undefined,
          parsedResumeData: data.parsedResumeData ? data.parsedResumeData as Prisma.InputJsonValue : undefined,
          resumeOnboardingComplete: data.completeOnboarding ? true : undefined,
        },
      })

      if (data.fullName?.trim()) {
        await transaction.user.update({ where: { id: userId }, data: { name: data.fullName.trim() } })
      }

      if (data.education) {
        await transaction.candidateEducation.deleteMany({ where: { candidateProfileId: profile.id } })
        const records = data.education.filter((item) => item.degree.trim() && item.institution.trim())
        if (records.length) {
          await transaction.candidateEducation.createMany({
            data: records.map((item) => ({
              candidateProfileId: profile.id,
              degree: item.degree.trim(),
              institution: item.institution.trim(),
              fieldOfStudy: item.fieldOfStudy?.trim() || null,
              startYear: item.startYear,
              endYear: item.endYear,
              grade: item.grade?.trim() || null,
              description: item.description?.trim() || null,
            })),
          })
        }
      }

      if (data.skills || data.experience) {
        if (data.experience) await transaction.candidateExperience.deleteMany({ where: { candidateProfileId: profile.id } })
        if (data.skills) await transaction.candidateSkill.deleteMany({ where: { candidateProfileId: profile.id } })

        for (const skillName of cleanedSkills) {
          const normalizedName = normalizeName(skillName)
          const input = data.skills?.find((skill) => normalizeName(skill.skillName) === normalizedName)
          await transaction.candidateSkill.upsert({
            where: { candidateProfileId_normalizedName: { candidateProfileId: profile.id, normalizedName } },
            create: {
              candidateProfileId: profile.id,
              skillName: skillName.trim(),
              normalizedName,
              proficiency: input?.proficiency,
              yearsOfExperience: input?.yearsOfExperience,
            },
            update: {
              skillName: skillName.trim(),
              ...(input?.proficiency ? { proficiency: input.proficiency } : {}),
              ...(input?.yearsOfExperience != null ? { yearsOfExperience: input.yearsOfExperience } : {}),
            },
          })
        }
      }

      if (data.experience) {
        const candidateSkills = await transaction.candidateSkill.findMany({ where: { candidateProfileId: profile.id } })
        const skillByName = new Map(candidateSkills.map((skill) => [skill.normalizedName, skill.id]))
        for (const item of data.experience.filter((experience) => experience.company.trim() && experience.jobTitle.trim())) {
          const skillIds = uniqueText(item.skills ?? []).map((name) => skillByName.get(normalizeName(name))).filter((id): id is string => Boolean(id))
          await transaction.candidateExperience.create({
            data: {
              candidateProfileId: profile.id,
              company: item.company.trim(),
              jobTitle: item.jobTitle.trim(),
              employmentType: item.employmentType,
              location: item.location?.trim() || null,
              startDate: item.startDate ? new Date(item.startDate) : null,
              endDate: item.currentJob || !item.endDate ? null : new Date(item.endDate),
              currentJob: item.currentJob ?? false,
              description: item.description?.trim() || null,
              skills: { create: skillIds.map((skillId) => ({ skill: { connect: { id: skillId } } })) },
            },
          })
        }
      }

      if (data.projects) {
        await transaction.candidateProject.deleteMany({ where: { candidateProfileId: profile.id } })
        const records = data.projects.filter((item) => item.name.trim())
        if (records.length) {
          await transaction.candidateProject.createMany({
            data: records.map((item) => ({
              candidateProfileId: profile.id,
              name: item.name.trim(),
              description: item.description?.trim() || null,
              technologies: uniqueText(item.technologies),
              githubUrl: item.githubUrl,
              demoUrl: item.demoUrl,
              imageUrl: item.imageUrl,
              startDate: item.startDate ? new Date(item.startDate) : null,
              endDate: item.endDate ? new Date(item.endDate) : null,
            })),
          })
        }
      }

      if (data.certifications) {
        await transaction.candidateCertification.deleteMany({ where: { candidateProfileId: profile.id } })
        const records = data.certifications.filter((item) => item.name.trim() && item.issuingOrganization.trim())
        if (records.length) {
          await transaction.candidateCertification.createMany({
            data: records.map((item) => ({
              candidateProfileId: profile.id,
              name: item.name.trim(),
              issuingOrganization: item.issuingOrganization.trim(),
              issueDate: item.issueDate ? new Date(item.issueDate) : null,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
              credentialId: item.credentialId?.trim() || null,
              credentialUrl: item.credentialUrl,
            })),
          })
        }
      }

      if (data.languages) {
        await transaction.candidateLanguage.deleteMany({ where: { candidateProfileId: profile.id } })
        const languages = new Map(data.languages.filter((item) => item.language.trim()).map((item) => [normalizeName(item.language), item]))
        for (const [normalizedName, item] of languages) {
          await transaction.candidateLanguage.create({
            data: {
              candidateProfileId: profile.id,
              language: item.language.trim(),
              normalizedName,
              proficiency: item.proficiency,
            },
          })
        }
      }

      if (data.links) {
        await transaction.candidateLink.deleteMany({ where: { candidateProfileId: profile.id } })
        const links = new Map(data.links.map((item) => [item.type, item]))
        for (const [type, item] of links) {
          this.validateHttpUrl(item.url)
          await transaction.candidateLink.create({
            data: { candidateProfileId: profile.id, type: type as CandidateLinkType, label: item.label?.trim() || null, url: item.url.trim() },
          })
        }
      }

      if (data.preferences) {
        const preferences = data.preferences
        await transaction.candidateJobPreference.upsert({
          where: { candidateProfileId: profile.id },
          create: {
            candidateProfileId: profile.id,
            desiredTitles: uniqueText(preferences.desiredTitles),
            preferredLocations: uniqueText(preferences.preferredLocations),
            workModes: preferences.workModes ?? [],
            employmentTypes: preferences.employmentTypes ?? [],
            preferredIndustries: uniqueText(preferences.preferredIndustries),
            preferredFunctionalAreas: uniqueText(preferences.preferredFunctionalAreas),
            experienceMinYears: preferences.experienceMinYears,
            experienceMaxYears: preferences.experienceMaxYears,
            expectedSalaryMin: preferences.expectedSalaryMin,
            expectedSalaryMax: preferences.expectedSalaryMax,
          },
          update: {
            desiredTitles: preferences.desiredTitles ? uniqueText(preferences.desiredTitles) : undefined,
            preferredLocations: preferences.preferredLocations ? uniqueText(preferences.preferredLocations) : undefined,
            workModes: preferences.workModes,
            employmentTypes: preferences.employmentTypes,
            preferredIndustries: preferences.preferredIndustries ? uniqueText(preferences.preferredIndustries) : undefined,
            preferredFunctionalAreas: preferences.preferredFunctionalAreas ? uniqueText(preferences.preferredFunctionalAreas) : undefined,
            experienceMinYears: preferences.experienceMinYears,
            experienceMaxYears: preferences.experienceMaxYears,
            expectedSalaryMin: preferences.expectedSalaryMin,
            expectedSalaryMax: preferences.expectedSalaryMax,
          },
        })
      }
    })

    return this.getProfile(userId)
  }

  async getRecruiterVisibleProfile(profileId: string, requesterId: string, requesterRole: string) {
    const candidate = await this.prisma.candidateProfile.findUnique({
      where: { id: profileId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        skillsNormalized: { orderBy: { normalizedName: 'asc' } },
        education: { orderBy: [{ endYear: 'desc' }, { createdAt: 'asc' }] },
        experience: { include: { skills: { include: { skill: { select: { skillName: true } } } } }, orderBy: [{ currentJob: 'desc' }, { startDate: 'desc' }] },
        projects: { orderBy: { createdAt: 'desc' } },
        certifications: { orderBy: { issueDate: 'desc' } },
        languages: { orderBy: { normalizedName: 'asc' } },
      },
    })

    if (!candidate) throw new NotFoundException('Candidate profile was not found.')
    const isOwner = candidate.userId === requesterId
    const isRecruiter = ['EMPLOYER', 'ADMIN'].includes(requesterRole.toUpperCase())
    const isPublic = candidate.visibility === 'PUBLIC'
    const isRecruiterOnly = candidate.visibility === 'RECRUITERS_ONLY'

    if (!isOwner && (!isPublic && !(isRecruiterOnly && isRecruiter && candidate.showInRecruiterSearch))) {
      throw new NotFoundException('Candidate profile was not found.')
    }

    const latestResume = candidate.showResumeToRecruiters && isRecruiter
      ? await this.prisma.resume.findFirst({
        where: { userId: candidate.userId, status: 'PARSED' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, originalFileName: true, mimeType: true, fileSize: true, createdAt: true },
      })
      : null

    return {
      id: candidate.id,
      name: candidate.user.name,
      headline: candidate.headline,
      location: candidate.location,
      bio: candidate.bio,
      currentJobTitle: candidate.currentJobTitle,
      currentCompany: candidate.currentCompany,
      totalExperienceYears: candidate.totalExperienceYears,
      totalExperienceMonths: candidate.totalExperienceMonths,
      industry: candidate.industry,
      functionalArea: candidate.functionalArea,
      careerLevel: candidate.careerLevel,
      openToWork: candidate.openToWork,
      skills: candidate.skillsNormalized.map(({ skillName, proficiency, yearsOfExperience }) => ({ skillName, proficiency, yearsOfExperience })),
      education: candidate.education,
      experience: candidate.experience.map((item) => ({ ...item, skills: item.skills.map((relation) => relation.skill.skillName) })),
      projects: candidate.projects,
      certifications: candidate.certifications,
      languages: candidate.languages,
      contact: candidate.allowRecruiterContact ? { email: candidate.user.email, phone: candidate.phone } : null,
      resume: latestResume,
    }
  }

  async getRecruiterResumeFile(profileId: string, requesterId: string, requesterRole: string) {
    const visibleProfile = await this.getRecruiterVisibleProfile(profileId, requesterId, requesterRole)
    if (!visibleProfile.resume) throw new NotFoundException('Candidate resume was not found.')

    const resume = await this.prisma.resume.findUnique({
      where: { id: visibleProfile.resume.id },
      select: { userId: true, storedFileName: true, originalFileName: true, mimeType: true },
    })
    if (!resume) throw new NotFoundException('Candidate resume was not found.')

    const storageRoot = resolve(process.env.RESUME_STORAGE_DIR || resolve(process.cwd(), 'uploads', 'resumes'))
    return {
      path: resolve(storageRoot, resume.userId, resume.storedFileName),
      fileName: resume.originalFileName,
      mimeType: resume.mimeType,
    }
  }

  async getCandidateResumeFile(userId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { userId, status: 'PARSED' },
      orderBy: { createdAt: 'desc' },
      select: { userId: true, storedFileName: true, originalFileName: true, mimeType: true },
    })
    if (!resume) throw new NotFoundException('Candidate resume was not found.')

    const storageRoot = resolve(process.env.RESUME_STORAGE_DIR || resolve(process.cwd(), 'uploads', 'resumes'))
    return {
      path: resolve(storageRoot, resume.userId, resume.storedFileName),
      fileName: resume.originalFileName,
      mimeType: resume.mimeType,
    }
  }

  async uploadProfilePhoto(userId: string, file?: Express.Multer.File) {
    if (!file || !file.buffer?.length) throw new BadRequestException('Please select a profile photo.')
    if (file.size > MAX_PROFILE_PHOTO_SIZE) throw new BadRequestException('Profile photo must be 5MB or smaller.')
    const format = PROFILE_PHOTO_TYPES[file.mimetype]
    if (!format || extname(file.originalname).slice(1).toLowerCase().replace('jpeg', 'jpg') !== format.extension || !format.signature(file.buffer)) {
      throw new BadRequestException('Upload a valid JPEG, PNG, or WebP image.')
    }

    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId }, select: { id: true, profilePhotoStoredName: true } })
    if (!profile) throw new NotFoundException('Candidate profile was not found.')
    const storedName = `${randomUUID()}.${format.extension}`
    const storageRoot = resolve(process.env.PROFILE_PHOTO_STORAGE_DIR || resolve(process.cwd(), 'uploads', 'profile-photos'))
    const absolutePath = resolve(storageRoot, userId, storedName)
    await mkdir(resolve(storageRoot, userId), { recursive: true })
    await writeFile(absolutePath, file.buffer, { flag: 'wx' })

    try {
      await this.prisma.candidateProfile.update({
        where: { id: profile.id },
        data: { profilePhotoStoredName: storedName, profilePhotoMimeType: file.mimetype, profileImageUrl: '/api/candidate/profile-photo' },
      })
    } catch (error) {
      await unlink(absolutePath).catch(() => undefined)
      throw error
    }

    if (profile.profilePhotoStoredName) {
      await unlink(resolve(storageRoot, userId, profile.profilePhotoStoredName)).catch(() => undefined)
    }
    return { success: true, profilePhotoUrl: '/api/candidate/profile-photo' }
  }

  async removeProfilePhoto(userId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId }, select: { id: true, profilePhotoStoredName: true } })
    if (!profile) throw new NotFoundException('Candidate profile was not found.')
    await this.prisma.candidateProfile.update({
      where: { id: profile.id },
      data: { profilePhotoStoredName: null, profilePhotoMimeType: null, profileImageUrl: null },
    })
    if (profile.profilePhotoStoredName) {
      const storageRoot = resolve(process.env.PROFILE_PHOTO_STORAGE_DIR || resolve(process.cwd(), 'uploads', 'profile-photos'))
      await unlink(resolve(storageRoot, userId, profile.profilePhotoStoredName)).catch(() => undefined)
    }
    return { success: true }
  }

  async getProfilePhoto(userId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      select: { profilePhotoStoredName: true, profilePhotoMimeType: true },
    })
    if (!profile?.profilePhotoStoredName || !profile.profilePhotoMimeType) throw new NotFoundException('Profile photo was not found.')
    const storageRoot = resolve(process.env.PROFILE_PHOTO_STORAGE_DIR || resolve(process.cwd(), 'uploads', 'profile-photos'))
    return { path: resolve(storageRoot, userId, profile.profilePhotoStoredName), mimeType: profile.profilePhotoMimeType }
  }

  private validateHttpUrl(value: string) {
    try {
      const url = new URL(value)
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol')
    } catch {
      throw new BadRequestException('Please enter a valid HTTP or HTTPS URL.')
    }
  }
}
