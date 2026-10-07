import apiClient from './apiClient'

export type ParsedResumeEntry = Record<string, string | boolean>

export type ParsedResumeData = {
  personal?: {
    fullName?: string | null
    email?: string | null
    phone?: string | null
    location?: string | null
    linkedin?: string | null
    github?: string | null
    portfolio?: string | null
  }
  summary?: string
  skills?: string[]
  education?: ParsedResumeEntry[]
  experience?: ParsedResumeEntry[]
  projects?: ParsedResumeEntry[]
  certifications?: ParsedResumeEntry[]
  languages?: string[]
  preferences?: Record<string, string>
}

export type CandidateProfileResponse = {
  user: { id: string; name: string; email: string }
  onboardingComplete: boolean
  profile: {
    id: string
    fullName: string
    email: string
    phone: string | null
    gender: string | null
    dateOfBirth: string | null
    headline: string | null
    location: string | null
    bio: string | null
    profilePhotoUrl: string | null
    currentJobTitle: string | null
    currentCompany: string | null
    totalExperienceYears: number | null
    totalExperienceMonths: number | null
    industry: string | null
    functionalArea: string | null
    careerLevel: string | null
    noticePeriodDays: number | null
    currentSalary: number | null
    workAuthorization: string | null
    willingToRelocate: string | null
    relocationLocations: string[]
    openToWork: 'ACTIVELY_LOOKING' | 'OPEN_TO_OPPORTUNITIES' | 'NOT_LOOKING'
    availability: string | null
    customNoticePeriodDays: number | null
    visibility: 'PUBLIC' | 'RECRUITERS_ONLY' | 'PRIVATE'
    allowRecruiterContact: boolean
    showInRecruiterSearch: boolean
    showResumeToRecruiters: boolean
    skills: Array<{ id: string; skillName: string; proficiency: string; yearsOfExperience: number | string | null }>
    education: Array<{ id: string; degree: string; institution: string; fieldOfStudy: string | null; startYear: number | null; endYear: number | null; grade: string | null; description: string | null }>
    experience: Array<{ id: string; company: string; jobTitle: string; employmentType: string | null; location: string | null; startDate: string | null; endDate: string | null; currentJob: boolean; description: string | null; skills: Array<{ id: string; skillName: string }> }>
    projects: Array<{ id: string; name: string; description: string | null; technologies: string[]; githubUrl: string | null; demoUrl: string | null; imageUrl: string | null; startDate: string | null; endDate: string | null }>
    certifications: Array<{ id: string; name: string; issuingOrganization: string; issueDate: string | null; expiryDate: string | null; credentialId: string | null; credentialUrl: string | null }>
    languages: Array<{ id: string; language: string; proficiency: string }>
    links: Array<{ id: string; type: string; label: string | null; url: string }>
    preferences: null | {
      desiredTitles: string[]
      preferredLocations: string[]
      workModes: string[]
      employmentTypes: string[]
      preferredIndustries: string[]
      preferredFunctionalAreas: string[]
      experienceMinYears: number | string | null
      experienceMaxYears: number | string | null
      expectedSalaryMin: number | null
      expectedSalaryMax: number | null
    }
    parsedResumeData: ParsedResumeData | null
    resumeDraftPendingReview: boolean
    profileCompletion: {
      percentage: number
      missing: string[]
      preferencesComplete: boolean
      sections: Array<{ label: string; complete: boolean }>
    }
  }
  latestResume: null | {
    id: string
    originalFileName: string
    mimeType: string
    fileSize: number
    status: 'PARSED'
    parsedData: ParsedResumeData | null
    createdAt: string
  }
}

export type ResumeUploadResponse = {
  success: boolean
  resumeId: string
  status: 'parsed' | 'failed'
  resume: {
    id: string
    originalFileName: string
    mimeType: string
    fileSize: number
    status: 'PARSED' | 'FAILED'
  }
  parsedData?: ParsedResumeData
  message?: string
}

export type CandidateProfileUpdate = {
  fullName?: string
  phone?: string
  gender?: string
  dateOfBirth?: string | null
  headline?: string
  location?: string
  bio?: string
  currentJobTitle?: string
  currentCompany?: string
  totalExperienceYears?: number | null
  totalExperienceMonths?: number | null
  industry?: string
  functionalArea?: string
  careerLevel?: string
  noticePeriodDays?: number | null
  currentSalary?: number | null
  workAuthorization?: string
  willingToRelocate?: string
  relocationLocations?: string[]
  openToWork?: string
  availability?: string | null
  customNoticePeriodDays?: number | null
  visibility?: string
  allowRecruiterContact?: boolean
  showInRecruiterSearch?: boolean
  showResumeToRecruiters?: boolean
  skills?: Array<{ skillName: string; proficiency: string; yearsOfExperience: number | null }>
  education?: Array<{ degree: string; institution: string; fieldOfStudy?: string; startYear?: number; endYear?: number; grade?: string; description?: string }>
  experience?: Array<{ company: string; jobTitle: string; employmentType?: string; location?: string; startDate?: string; endDate?: string | null; currentJob: boolean; description?: string; skills: string[] }>
  projects?: Array<{ name: string; description?: string; technologies: string[]; githubUrl?: string; demoUrl?: string; imageUrl?: string; startDate?: string; endDate?: string }>
  certifications?: Array<{ name: string; issuingOrganization: string; issueDate?: string; expiryDate?: string; credentialId?: string; credentialUrl?: string }>
  languages?: Array<{ language: string; proficiency: string }>
  links?: Array<{ type: string; label?: string; url: string }>
  preferences?: {
    desiredTitles: string[]
    preferredLocations: string[]
    workModes: string[]
    employmentTypes: string[]
    preferredIndustries: string[]
    preferredFunctionalAreas: string[]
    experienceMinYears: number | null
    experienceMaxYears: number | null
    expectedSalaryMin: number | null
    expectedSalaryMax: number | null
  }
  parsedResumeData?: ParsedResumeData
  completeOnboarding?: boolean
}

export const candidateService = {
  async getProfile() {
    const response = await apiClient.get<CandidateProfileResponse>('/candidate/profile')
    return response.data
  },

  async saveProfile(payload: CandidateProfileUpdate) {
    const response = await apiClient.patch<CandidateProfileResponse>('/candidate/profile', payload)
    return response.data
  },

  async uploadProfilePhoto(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<{ success: boolean; profilePhotoUrl: string }>('/candidate/profile-photo', formData)
    return response.data
  },

  async removeProfilePhoto() {
    const response = await apiClient.delete<{ success: boolean }>('/candidate/profile-photo')
    return response.data
  },

  getProfilePhotoUrl(path: string) {
    return new URL(path, apiClient.defaults.baseURL).toString()
  },

  getResumeUrl() {
    return new URL('/api/candidate/resume', apiClient.defaults.baseURL).toString()
  },

  async uploadResume(file: File, onProgress?: (percent: number) => void) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post<ResumeUploadResponse>('/candidate/resume', formData, {
      onUploadProgress: (event) => {
        if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100))
      },
    })
    return response.data
  },
}