import type { CandidateProfile, CandidateSkill } from '../types/candidate.types'
import type { CandidateProfileResponse, ParsedResumeData, ParsedResumeEntry } from '../services/candidateService'

const emptyPreferences = {
  desiredTitles: [],
  preferredLocations: [],
  workModes: [],
  employmentTypes: [],
  preferredIndustries: [],
  preferredFunctionalAreas: [],
  experienceMinYears: null,
  experienceMaxYears: null,
  expectedSalaryMin: null,
  expectedSalaryMax: null,
}

const emptyProfessional = {
  currentJobTitle: '',
  currentCompany: '',
  totalExperienceYears: null,
  totalExperienceMonths: null,
  industry: '',
  functionalArea: '',
  careerLevel: '',
  noticePeriodDays: null,
  currentSalary: null,
  workAuthorization: '',
  willingToRelocate: '',
  relocationLocations: [],
  availability: '',
  customNoticePeriodDays: null,
}

function text(entry: ParsedResumeEntry | undefined, field: string) {
  const value = entry?.[field]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function skillNames(value: ParsedResumeEntry['skills'] | CandidateProfileResponse['profile']['experience'][number]['skills']) {
  if (!Array.isArray(value)) return []
  return value.flatMap((skill) => {
    if (typeof skill === 'string') return [skill]
    if (typeof skill === 'object' && skill !== null && 'skillName' in skill && typeof skill.skillName === 'string') return [skill.skillName]
    return []
  })
}

export function mapCandidateProfile(response: CandidateProfileResponse, parsedOverride?: ParsedResumeData): CandidateProfile {
  const parsed = parsedOverride ?? response.profile.parsedResumeData ?? response.latestResume?.parsedData ?? null
  const personal = parsed?.personal
  const education = response.profile.education.length ? response.profile.education as unknown as ParsedResumeEntry[] : parsed?.education ?? []
  const experience = response.profile.experience.length ? response.profile.experience as unknown as ParsedResumeEntry[] : parsed?.experience ?? []
  const projects = response.profile.projects.length ? response.profile.projects as unknown as ParsedResumeEntry[] : parsed?.projects ?? []
  const certifications = response.profile.certifications.length ? response.profile.certifications as unknown as ParsedResumeEntry[] : parsed?.certifications ?? []
  const skills: CandidateSkill[] = response.profile.skills.length
    ? response.profile.skills.map((skill) => ({
      id: skill.id,
      skillName: skill.skillName,
      proficiency: skill.proficiency as CandidateSkill['proficiency'],
      yearsOfExperience: skill.yearsOfExperience == null ? null : Number(skill.yearsOfExperience),
    }))
    : (parsed?.skills ?? []).map((skillName) => ({ skillName, proficiency: 'INTERMEDIATE', yearsOfExperience: null }))
  const savedPreferences = response.profile.preferences
  const savedLinks = new Map(response.profile.links.map((link) => [link.type, link.url]))
  const preferenceStrings = parsed?.preferences ?? {}
  const splitPreference = (key: string) => preferenceStrings[key]?.split(',').map((item) => item.trim()).filter(Boolean) ?? []
  const parsedLinks = [
    { type: 'LINKEDIN' as const, label: 'LinkedIn', url: personal?.linkedin ?? '' },
    { type: 'GITHUB' as const, label: 'GitHub', url: personal?.github ?? '' },
    { type: 'PORTFOLIO' as const, label: 'Portfolio', url: personal?.portfolio ?? '' },
  ].filter((link) => link.url)

  return {
    fullName: response.user.name,
    email: response.user.email,
    resumeEmail: personal?.email && personal.email !== response.user.email ? personal.email : '',
    dateOfBirth: response.profile.dateOfBirth?.slice(0, 10) ?? '',
    profilePhotoUrl: response.profile.profilePhotoUrl ?? '',
    headline: response.profile.headline ?? '',
    location: response.profile.location ?? personal?.location ?? '',
    phone: response.profile.phone ?? personal?.phone ?? '',
    gender: response.profile.gender ?? '',
    linkedin: personal?.linkedin ?? savedLinks.get('LINKEDIN') ?? '',
    github: personal?.github ?? savedLinks.get('GITHUB') ?? '',
    portfolio: personal?.portfolio ?? savedLinks.get('PORTFOLIO') ?? savedLinks.get('PERSONAL_WEBSITE') ?? '',
    summary: response.profile.bio ?? parsed?.summary ?? '',
    skills,
    experience: experience.map((entry, index) => ({
      id: text(entry, 'id') || `experience-${index + 1}`,
      title: text(entry, 'title') || text(entry, 'jobTitle'),
      company: text(entry, 'company'),
      employmentType: text(entry, 'employmentType'),
      location: text(entry, 'location'),
      startDate: dateInput(text(entry, 'startDate')),
      endDate: dateInput(text(entry, 'endDate')),
      currentlyWorking: entry.currentlyWorking === true || entry.currentlyWorking === 'true' || entry.currentJob === true,
      description: text(entry, 'description') || text(entry, 'details'),
      skills: skillNames(entry.skills),
    })),
    education: education.map((entry, index) => ({
      id: text(entry, 'id') || `education-${index + 1}`,
      institution: text(entry, 'institution'),
      degree: text(entry, 'degree'),
      fieldOfStudy: text(entry, 'fieldOfStudy'),
      startDate: text(entry, 'startDate') || text(entry, 'startYear'),
      endDate: text(entry, 'endDate') || text(entry, 'endYear'),
      grade: text(entry, 'grade'),
      description: text(entry, 'description') || text(entry, 'details'),
    })),
    projects: projects.map((entry, index) => ({
      id: text(entry, 'id') || `project-${index + 1}`,
      name: text(entry, 'name'),
      description: text(entry, 'description') || text(entry, 'details'),
      technologies: Array.isArray(entry.technologies) ? entry.technologies.map(String).join(', ') : text(entry, 'technologies'),
      projectUrl: text(entry, 'projectUrl') || text(entry, 'demoUrl') || text(entry, 'githubUrl'),
      projectLinkType: text(entry, 'projectUrl') || text(entry, 'demoUrl') ? 'demo' : 'github',
      githubUrl: text(entry, 'githubUrl'),
      demoUrl: text(entry, 'demoUrl'),
      imageUrl: text(entry, 'imageUrl'),
      startDate: dateInput(text(entry, 'startDate')),
      endDate: dateInput(text(entry, 'endDate')),
    })),
    certifications: certifications.map((entry, index) => ({
      id: text(entry, 'id') || `certification-${index + 1}`,
      name: text(entry, 'name'),
      organisation: text(entry, 'organisation') || text(entry, 'issuingOrganization'),
      issueDate: dateInput(text(entry, 'issueDate')),
      expiryDate: dateInput(text(entry, 'expiryDate')),
      credentialId: text(entry, 'credentialId'),
      credentialUrl: text(entry, 'credentialUrl'),
    })),
    languages: response.profile.languages.length
      ? response.profile.languages.map((language) => ({ id: language.id, language: language.language, proficiency: language.proficiency as CandidateProfile['languages'][number]['proficiency'] }))
      : (parsed?.languages ?? []).map((language) => ({ language, proficiency: 'PROFESSIONAL' as const })),
    links: response.profile.links.length
      ? response.profile.links.map((link) => ({ id: link.id, type: link.type as CandidateProfile['links'][number]['type'], label: link.label ?? '', url: link.url }))
      : parsedLinks,
    professional: {
      ...emptyProfessional,
      currentJobTitle: response.profile.currentJobTitle ?? '',
      currentCompany: response.profile.currentCompany ?? '',
      totalExperienceYears: response.profile.totalExperienceYears,
      totalExperienceMonths: response.profile.totalExperienceMonths,
      industry: response.profile.industry ?? '',
      functionalArea: response.profile.functionalArea ?? '',
      careerLevel: response.profile.careerLevel ?? '',
      noticePeriodDays: response.profile.noticePeriodDays,
      currentSalary: response.profile.currentSalary,
      workAuthorization: response.profile.workAuthorization ?? '',
      willingToRelocate: response.profile.willingToRelocate ?? '',
      relocationLocations: response.profile.relocationLocations,
      availability: response.profile.availability ?? '',
      customNoticePeriodDays: response.profile.customNoticePeriodDays,
    },
    preferences: savedPreferences ? {
      desiredTitles: savedPreferences.desiredTitles,
      preferredLocations: savedPreferences.preferredLocations,
      workModes: savedPreferences.workModes,
      employmentTypes: savedPreferences.employmentTypes,
      preferredIndustries: savedPreferences.preferredIndustries,
      preferredFunctionalAreas: savedPreferences.preferredFunctionalAreas,
      experienceMinYears: savedPreferences.experienceMinYears == null ? null : Number(savedPreferences.experienceMinYears),
      experienceMaxYears: savedPreferences.experienceMaxYears == null ? null : Number(savedPreferences.experienceMaxYears),
      expectedSalaryMin: savedPreferences.expectedSalaryMin,
      expectedSalaryMax: savedPreferences.expectedSalaryMax,
    } : {
      ...emptyPreferences,
      desiredTitles: splitPreference('desiredTitles'),
      preferredLocations: splitPreference('preferredLocations'),
    },
    openToWork: response.profile.openToWork,
    visibility: response.profile.visibility,
    allowRecruiterContact: response.profile.allowRecruiterContact,
    showInRecruiterSearch: response.profile.showInRecruiterSearch,
    showResumeToRecruiters: response.profile.showResumeToRecruiters,
    profileCompletion: response.profile.profileCompletion,
    resume: {
      fileName: response.latestResume?.originalFileName ?? '',
      fileType: response.latestResume?.mimeType ?? '',
      fileSize: response.latestResume ? `${(response.latestResume.fileSize / (1024 * 1024)).toFixed(1)} MB` : '',
      parsingStatus: response.latestResume ? 'Parsed' : 'Uploaded',
    },
  }
}

export function makeParsedResumeData(profile: CandidateProfile, source?: ParsedResumeData | null): ParsedResumeData {
  return {
    ...source,
    personal: {
      ...source?.personal,
      fullName: source?.personal?.fullName ?? profile.fullName,
      email: profile.resumeEmail || source?.personal?.email || null,
      phone: profile.phone || null,
      location: profile.location || null,
      linkedin: profile.linkedin || null,
      github: profile.github || null,
      portfolio: profile.portfolio || null,
    },
    summary: profile.summary,
    skills: profile.skills.map((skill) => skill.skillName),
    experience: profile.experience.map(({ skills: _skills, ...item }) => item),
    education: profile.education,
    projects: profile.projects,
    certifications: profile.certifications,
    preferences: Object.fromEntries(Object.entries(profile.preferences).map(([key, value]) => [key, Array.isArray(value) ? value.join(', ') : value == null ? '' : String(value)])),
  }
}

function dateInput(value: string | null) {
  if (!value) return ''
  if (/^\d{4}$/.test(value)) return `${value}-01-01`
  const monthYear = value.match(/^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{4})$/i)
  if (monthYear) {
    const month = new Date(`${monthYear[1]} 1, 2000`).getMonth() + 1
    return `${monthYear[2]}-${String(month).padStart(2, '0')}-01`
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}