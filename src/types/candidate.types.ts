export type CandidateExperience = {
  id: string
  title: string
  company: string
  employmentType: string
  location: string
  startDate: string
  endDate: string
  currentlyWorking: boolean
  description: string
  skills: string[]
}

export type CandidateEducation = {
  id: string
  institution: string
  degree: string
  fieldOfStudy: string
  startDate: string
  endDate: string
  grade: string
  description: string
}

export type CandidateProject = {
  id: string
  name: string
  description: string
  technologies: string
  projectUrl: string
  projectLinkType?: 'github' | 'demo'
  githubUrl: string
  demoUrl: string
  imageUrl: string
  startDate: string
  endDate: string
}

export type CandidateCertification = {
  id: string
  name: string
  organisation: string
  issueDate: string
  expiryDate: string
  credentialId: string
  credentialUrl: string
}

export type CandidatePreferences = {
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

export type CandidateSkill = {
  id?: string
  skillName: string
  proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
  yearsOfExperience: number | null
}

export type CandidateLanguage = {
  id?: string
  language: string
  proficiency: 'BASIC' | 'CONVERSATIONAL' | 'PROFESSIONAL' | 'FLUENT' | 'NATIVE'
}

export type CandidateLink = {
  id?: string
  type: 'LINKEDIN' | 'GITHUB' | 'PERSONAL_WEBSITE' | 'PORTFOLIO' | 'KAGGLE' | 'BEHANCE' | 'OTHER'
  label: string
  url: string
}

export type CandidateProfessional = {
  currentJobTitle: string
  currentCompany: string
  totalExperienceYears: number | null
  totalExperienceMonths: number | null
  industry: string
  functionalArea: string
  careerLevel: string
  noticePeriodDays: number | null
  currentSalary: number | null
  workAuthorization: string
  willingToRelocate: string
  relocationLocations: string[]
  availability: string
  customNoticePeriodDays: number | null
}

export type CandidateProfileCompletion = {
  percentage: number
  missing: string[]
  preferencesComplete: boolean
  sections: Array<{ label: string; complete: boolean }>
}

export type CandidateResume = {
  fileName: string
  fileType: string
  fileSize: string
  parsingStatus: 'Uploaded' | 'Processing' | 'Parsed' | 'Profile Updated'
}

export type CandidateProfile = {
  fullName: string
  headline: string
  location: string
  email: string
  resumeEmail: string
  phone: string
  gender: string
  dateOfBirth: string
  profilePhotoUrl: string
  linkedin: string
  github: string
  portfolio: string
  summary: string
  skills: CandidateSkill[]
  experience: CandidateExperience[]
  education: CandidateEducation[]
  projects: CandidateProject[]
  certifications: CandidateCertification[]
  languages: CandidateLanguage[]
  links: CandidateLink[]
  professional: CandidateProfessional
  preferences: CandidatePreferences
  openToWork: 'ACTIVELY_LOOKING' | 'OPEN_TO_OPPORTUNITIES' | 'NOT_LOOKING'
  visibility: 'PUBLIC' | 'RECRUITERS_ONLY' | 'PRIVATE'
  allowRecruiterContact: boolean
  showInRecruiterSearch: boolean
  showResumeToRecruiters: boolean
  profileCompletion: CandidateProfileCompletion
  resume: CandidateResume
}

export type JobRecord = {
  id: string
  title: string
  company: string
  location: string
  workMode: string
  employmentType: string
  salary: string
  skills: string[]
  postedDate: string
  description: string
  responsibilities: string[]
  requirements: string[]
  preferredSkills: string[]
  education: string
  benefits: string[]
  match?: {
    score: number
    reasons: string[]
    matchedSkills: string[]
    missingSkills: string[]
  }
}

export type ApplicationStatus = 'Applied' | 'Screening' | 'Shortlisted' | 'Interview' | 'Offer' | 'Rejected' | 'Hired'

export type ApplicationRecord = {
  id: string
  jobTitle: string
  company: string
  appliedDate: string
  status: ApplicationStatus
  lastUpdated: string
  resumeUsed: string
  coverLetter: string
}

export type InterviewRecord = {
  id: string
  type: string
  date: string
  time: string
  meetingLink: string
  interviewer: string
  company: string
  status: 'Upcoming' | 'Completed' | 'Cancelled'
}

export type OfferRecord = {
  id: string
  company: string
  role: string
  salary: string
  startDate: string
  expiryDate: string
  status: 'Pending' | 'Accepted' | 'Rejected'
  benefits: string[]
}

export type Conversation = {
  id: string
  participant: string
  company: string
  unread: number
  lastMessage: string
  timestamp: string
}

export type Message = {
  id: string
  sender: 'me' | 'recruiter'
  text: string
  timestamp: string
}

export type NotificationCategory = 'Applications' | 'Interviews' | 'Offers' | 'Messages' | 'Job alerts' | 'Security'

export type NotificationItem = {
  id: string
  category: NotificationCategory
  title: string
  description: string
  timestamp: string
  read: boolean
}

export type JobAlert = {
  id: string
  title: string
  location: string
  skills: string
  salary: string
  workMode: string
  employmentType: string
  frequency: 'Daily' | 'Weekly' | 'Instant'
  active: boolean
}

export type CandidateSettingGroup = 'Account' | 'Profile' | 'Privacy' | 'Notifications' | 'Job Preferences' | 'Security'

export type CandidateSetting = {
  key: string
  label: string
  group: CandidateSettingGroup
  enabled: boolean
}
