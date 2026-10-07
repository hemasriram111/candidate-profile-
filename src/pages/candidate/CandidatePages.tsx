import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Bell,
  BriefcaseBusiness,
  Camera,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  MapPin,
  MessageSquareText,
  Search,
  Send,
  Sparkles,
  Trash2,
  UploadCloud,
  UserRound,
  X,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { CandidateEmptyState } from '../../components/candidate/CandidateEmptyState'
import { CandidateJobCard } from '../../components/candidate/CandidateJobCard'
import { ProfileCompletion } from '../../components/candidate/ProfileCompletion'
import { ProfileSection } from '../../components/candidate/ProfileSection'
import { useAuth } from '../../components/common/AuthContext'
import { candidateService, type ParsedResumeData } from '../../services/candidateService'
import { candidateJourneyService, type ApplicationApiRecord, type InterviewApiRecord, type OfferApiRecord } from '../../services/candidateJourneyService'
import { jobService } from '../../services/jobService'
import { useSavedJobs } from '../../hooks/useSavedJobs'
import { makeParsedResumeData, mapCandidateProfile } from '../../utils/candidateProfileMapper'
import type {
  CandidateCertification,
  CandidateEducation,
  CandidateExperience,
  CandidateLanguage,
  CandidateLink,
  CandidateProfile,
  CandidateProject,
  JobAlert,
  JobRecord,
  NotificationCategory,
  NotificationItem,
} from '../../types/candidate.types'
import type { Job, JobPage } from '../../types/job.types'

export { CandidateProfilePage } from './CandidateProfilePage'

type PageHeaderProps = {
  eyebrow: string
  title: string
  action?: React.ReactNode
}

function PageHeader({ eyebrow, title, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--color-text)] sm:text-4xl">{title}</h1>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}

function parseJobSort(value: string | null): 'relevance' | 'newest' | 'salary' {
  return value === 'newest' || value === 'salary' ? value : 'relevance'
}

const emptyProfile: CandidateProfile = {
  fullName: '',
  headline: '',
  location: '',
  email: '',
  resumeEmail: '',
  phone: '',
  gender: '',
  dateOfBirth: '',
  profilePhotoUrl: '',
  linkedin: '',
  github: '',
  portfolio: '',
  summary: '',
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  languages: [],
  links: [],
  professional: {
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
  },
  preferences: {
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
  },
  openToWork: 'NOT_LOOKING',
  visibility: 'RECRUITERS_ONLY',
  allowRecruiterContact: true,
  showInRecruiterSearch: true,
  showResumeToRecruiters: true,
  profileCompletion: { percentage: 0, missing: [], preferencesComplete: false, sections: [] },
  resume: {
    fileName: '',
    fileType: '',
    fileSize: '',
    parsingStatus: 'Uploaded',
  },
}

function toDateInput(value: string) {
  if (!value) return undefined
  if (/^\d{4}$/.test(value)) return `${value}-01-01`
  const monthYear = value.match(/^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{4})$/i)
  if (monthYear) {
    const month = new Date(`${monthYear[1]} 1, 2000`).getMonth() + 1
    return `${monthYear[2]}-${String(month).padStart(2, '0')}-01`
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined
}

const statusStyles: Record<string, string> = {
  Applied: 'bg-slate-100 text-slate-700',
  Screening: 'bg-amber-100 text-amber-700',
  Shortlisted: 'bg-blue-100 text-blue-700',
  Interview: 'bg-violet-100 text-violet-700',
  Offer: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700',
  Hired: 'bg-green-100 text-green-700',
}

const applicationStatusLabels: Record<ApplicationApiRecord['status'], string> = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  HIRED: 'Hired',
}

const applicationProgression: ApplicationApiRecord['status'][] = [
  'APPLIED',
  'SCREENING',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER',
  'HIRED',
]

function formatJourneyDate(value: string | null | undefined) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function toCandidateJobRecord(job: Job): JobRecord {
  return {
    id: job.id,
    title: job.title,
    company: job.companyName,
    location: job.location,
    workMode: job.workMode,
    employmentType: job.employmentType,
    salary: job.salary,
    skills: job.skills,
    postedDate: job.postedAt,
    description: job.description,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    preferredSkills: job.skills,
    education: 'Not specified',
    benefits: job.benefits,
    match: job.match,
  }
}

const notificationCategories: NotificationCategory[] = ['Applications', 'Interviews', 'Offers', 'Messages', 'Job alerts', 'Security']
const PROFILE_SAVE_NOTICE_KEY = 'clyptus-profile-save-notice'

export function CandidateProfileLegacyPage() {
  const { user, refreshSession } = useAuth()
  const location = useLocation()
  const [profile, setProfile] = useState<CandidateProfile>(emptyProfile)
  const [skillInput, setSkillInput] = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isResumeReview, setIsResumeReview] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileNotice, setProfileNotice] = useState(() => (
    sessionStorage.getItem(PROFILE_SAVE_NOTICE_KEY) === 'saved'
      ? 'Your profile changes have been saved.'
      : ''
  ))
  const [sourceParsedData, setSourceParsedData] = useState<ParsedResumeData | null>(null)
  const [isPhotoSaving, setIsPhotoSaving] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)
  const profileName = user?.name || user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || ''
  const profileEmail = user?.email || ''
  const profileInitial = profileName.charAt(0).toUpperCase()

  useEffect(() => {
    let isActive = true
    const routeState = location.state as { parsedData?: ParsedResumeData } | null

    setIsLoadingProfile(true)
    setProfileError('')
    void candidateService.getProfile().then((response) => {
      if (!isActive) return
      const parsedOverride = routeState?.parsedData
      const parsedSource = parsedOverride ?? response.profile.parsedResumeData ?? response.latestResume?.parsedData ?? null
      setProfile(mapCandidateProfile(response, parsedOverride))
      setSourceParsedData(parsedSource)
      setIsResumeReview(Boolean(parsedOverride || response.profile.resumeDraftPendingReview || (!response.onboardingComplete && parsedSource)))
      setIsLoadingProfile(false)
    }).catch((error: unknown) => {
      if (!isActive) return
      const message = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      setProfileError(message || 'We could not load your candidate profile. Please refresh and try again.')
      setIsLoadingProfile(false)
    })

    return () => { isActive = false }
  }, [location.key, user?.id])

  useEffect(() => {
    sessionStorage.removeItem(PROFILE_SAVE_NOTICE_KEY)
  }, [])

  const saveProfile = async () => {
    setProfileError('')
    setProfileNotice('')
    setIsSavingProfile(true)
    try {
      const updated = await candidateService.saveProfile({
        fullName: profile.fullName,
        phone: profile.phone,
        gender: profile.gender || undefined,
        dateOfBirth: profile.dateOfBirth || null,
        headline: profile.headline,
        location: profile.location,
        bio: profile.summary,
        skills: profile.skills.map((skill) => ({
          skillName: skill.skillName,
          proficiency: skill.proficiency,
          yearsOfExperience: skill.yearsOfExperience,
        })),
        currentJobTitle: profile.professional.currentJobTitle,
        currentCompany: profile.professional.currentCompany,
        totalExperienceYears: profile.professional.totalExperienceYears,
        totalExperienceMonths: profile.professional.totalExperienceMonths,
        industry: profile.professional.industry,
        functionalArea: profile.professional.functionalArea,
        careerLevel: profile.professional.careerLevel || undefined,
        noticePeriodDays: profile.professional.noticePeriodDays,
        currentSalary: profile.professional.currentSalary,
        workAuthorization: profile.professional.workAuthorization || undefined,
        willingToRelocate: profile.professional.willingToRelocate || undefined,
        relocationLocations: profile.professional.relocationLocations,
        availability: profile.professional.availability || undefined,
        customNoticePeriodDays: profile.professional.customNoticePeriodDays,
        openToWork: profile.openToWork,
        visibility: profile.visibility,
        allowRecruiterContact: profile.allowRecruiterContact,
        showInRecruiterSearch: profile.showInRecruiterSearch,
        showResumeToRecruiters: profile.showResumeToRecruiters,
        education: profile.education
          .filter((item) => item.degree.trim() && item.institution.trim())
          .map((item) => ({
            degree: item.degree,
            institution: item.institution,
            fieldOfStudy: item.fieldOfStudy || undefined,
            startYear: Number.parseInt(item.startDate, 10) || undefined,
            endYear: Number.parseInt(item.endDate, 10) || undefined,
            grade: item.grade || undefined,
            description: item.description || undefined,
          })),
        experience: profile.experience
          .filter((item) => item.title.trim() && item.company.trim())
          .map((item) => ({
            company: item.company,
            jobTitle: item.title,
            employmentType: item.employmentType.toUpperCase().replaceAll(' ', '_') || undefined,
            location: item.location || undefined,
            startDate: toDateInput(item.startDate),
            endDate: item.currentlyWorking ? null : toDateInput(item.endDate) ?? null,
            currentJob: item.currentlyWorking,
            description: item.description || undefined,
            skills: item.skills,
          })),
        projects: profile.projects.filter((item) => item.name.trim()).map((item) => ({
          name: item.name,
          description: item.description || undefined,
          technologies: item.technologies.split(/[,\n]+/).map((value) => value.trim()).filter(Boolean),
          githubUrl: item.githubUrl || undefined,
          demoUrl: item.demoUrl || item.projectUrl || undefined,
          imageUrl: item.imageUrl || undefined,
          startDate: toDateInput(item.startDate),
          endDate: toDateInput(item.endDate),
        })),
        certifications: profile.certifications.filter((item) => item.name.trim() && item.organisation.trim()).map((item) => ({
          name: item.name,
          issuingOrganization: item.organisation,
          issueDate: toDateInput(item.issueDate),
          expiryDate: toDateInput(item.expiryDate),
          credentialId: item.credentialId || undefined,
          credentialUrl: item.credentialUrl || undefined,
        })),
        languages: profile.languages.filter((item) => item.language.trim()).map((item) => ({ language: item.language, proficiency: item.proficiency })),
        links: [
          ...profile.links.filter((item) => item.type !== 'LINKEDIN' && item.type !== 'GITHUB' && item.type !== 'PORTFOLIO'),
          ...(profile.linkedin ? [{ type: 'LINKEDIN', label: 'LinkedIn', url: profile.linkedin }] : []),
          ...(profile.github ? [{ type: 'GITHUB', label: 'GitHub', url: profile.github }] : []),
          ...(profile.portfolio ? [{ type: 'PORTFOLIO', label: 'Portfolio', url: profile.portfolio }] : []),
        ].filter((item) => item.url.trim()).map((item) => ({ type: item.type, label: item.label || undefined, url: item.url })),
        preferences: profile.preferences,
        parsedResumeData: makeParsedResumeData(profile, sourceParsedData),
        completeOnboarding: true,
      })
      sessionStorage.setItem(PROFILE_SAVE_NOTICE_KEY, 'saved')
      const refreshedUser = await refreshSession()
      if (!refreshedUser) sessionStorage.removeItem(PROFILE_SAVE_NOTICE_KEY)
      setProfile(mapCandidateProfile(updated))
      setSourceParsedData(makeParsedResumeData(profile, sourceParsedData))
      setIsResumeReview(false)
      setProfileNotice('Your profile changes have been saved.')
    } catch (error) {
      const message = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      setProfileError(message || 'We could not save your profile. Please try again.')
    } finally {
      setIsSavingProfile(false)
    }
  }
  const completion = profile.profileCompletion.percentage

  const handleProfilePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Choose a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Profile photo must be 5MB or smaller.')
      return
    }
    setIsPhotoSaving(true)
    setPhotoError('')
    try {
      await candidateService.uploadProfilePhoto(file)
      setProfile(mapCandidateProfile(await candidateService.getProfile()))
    } catch {
      setPhotoError('Could not upload your profile photo.')
    } finally {
      setIsPhotoSaving(false)
      event.target.value = ''
    }
  }

  const removeProfilePhoto = async () => {
    setIsPhotoSaving(true)
    setPhotoError('')
    try {
      await candidateService.removeProfilePhoto()
      setProfile(mapCandidateProfile(await candidateService.getProfile()))
    } catch {
      setPhotoError('Could not remove your profile photo.')
    } finally {
      setIsPhotoSaving(false)
    }
  }

  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (!trimmed) return
    const normalized = trimmed.normalize('NFKC').trim().toLocaleLowerCase()
    setProfile((prev) => prev.skills.some((skill) => skill.skillName.normalize('NFKC').trim().toLocaleLowerCase() === normalized)
      ? prev
      : { ...prev, skills: [...prev.skills, { skillName: trimmed, proficiency: 'INTERMEDIATE', yearsOfExperience: null }] })
    setSkillInput('')
  }

  const removeSkill = (skillName: string) => {
    setProfile((prev) => ({ ...prev, skills: prev.skills.filter((value) => value.skillName !== skillName) }))
  }

  const addExperience = () => {
    const newExperience: CandidateExperience = {
      id: Date.now().toString(),
      title: '',
      company: '',
      employmentType: '',
      location: '',
      startDate: '',
      endDate: '',
      currentlyWorking: false,
      description: '',
      skills: [],
    }
    setProfile((prev) => ({ ...prev, experience: [...prev.experience, newExperience] }))
  }

  const updateExperience = (id: string, updates: Partial<CandidateExperience>) => {
    setProfile((prev) => ({
      ...prev,
      experience: prev.experience.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }))
  }

  const removeExperience = (id: string) => {
    setProfile((prev) => ({ ...prev, experience: prev.experience.filter((item) => item.id !== id) }))
  }

  const addEducation = () => {
    const newEducation: CandidateEducation = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      grade: '',
      description: '',
    }
    setProfile((prev) => ({ ...prev, education: [...prev.education, newEducation] }))
  }

  const updateEducation = (id: string, updates: Partial<CandidateEducation>) => {
    setProfile((prev) => ({
      ...prev,
      education: prev.education.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }))
  }

  const removeEducation = (id: string) => {
    setProfile((prev) => ({ ...prev, education: prev.education.filter((item) => item.id !== id) }))
  }

  const addProject = () => {
    const newProject: CandidateProject = {
      id: Date.now().toString(),
      name: '',
      description: '',
      technologies: '',
      projectUrl: '',
      githubUrl: '',
      demoUrl: '',
      imageUrl: '',
      startDate: '',
      endDate: '',
    }
    setProfile((prev) => ({ ...prev, projects: [...prev.projects, newProject] }))
  }

  const updateProject = (id: string, updates: Partial<CandidateProject>) => {
    setProfile((prev) => ({
      ...prev,
      projects: prev.projects.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }))
  }

  const removeProject = (id: string) => {
    setProfile((prev) => ({ ...prev, projects: prev.projects.filter((item) => item.id !== id) }))
  }

  const addCertification = () => {
    const newCertification: CandidateCertification = {
      id: Date.now().toString(),
      name: '',
      organisation: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      credentialUrl: '',
    }
    setProfile((prev) => ({ ...prev, certifications: [...prev.certifications, newCertification] }))
  }

  const updateCertification = (id: string, updates: Partial<CandidateCertification>) => {
    setProfile((prev) => ({
      ...prev,
      certifications: prev.certifications.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }))
  }

  const removeCertification = (id: string) => {
    setProfile((prev) => ({ ...prev, certifications: prev.certifications.filter((item) => item.id !== id) }))
  }

  const addLanguage = () => setProfile((prev) => ({
    ...prev,
    languages: [...prev.languages, { id: Date.now().toString(), language: '', proficiency: 'PROFESSIONAL' }],
  }))

  const updateLanguage = (id: string, updates: Partial<CandidateLanguage>) => setProfile((prev) => ({
    ...prev,
    languages: prev.languages.map((item) => item.id === id ? { ...item, ...updates } : item),
  }))

  const removeLanguage = (id: string) => setProfile((prev) => ({
    ...prev,
    languages: prev.languages.filter((item) => item.id !== id),
  }))

  const addLink = () => setProfile((prev) => ({
    ...prev,
    links: [...prev.links, { id: Date.now().toString(), type: 'OTHER', label: '', url: '' }],
  }))

  const updateLink = (id: string, updates: Partial<CandidateLink>) => setProfile((prev) => ({
    ...prev,
    links: prev.links.map((item) => item.id === id ? { ...item, ...updates } : item),
  }))

  const removeLink = (id: string) => setProfile((prev) => ({
    ...prev,
    links: prev.links.filter((item) => item.id !== id),
  }))

  const updatePreferenceList = (field: 'desiredTitles' | 'preferredLocations' | 'workModes' | 'employmentTypes' | 'preferredIndustries' | 'preferredFunctionalAreas', value: string) => {
    setProfile((prev) => ({ ...prev, preferences: { ...prev.preferences, [field]: value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean) } }))
  }

  const updatePreferenceNumber = (field: 'experienceMinYears' | 'experienceMaxYears' | 'expectedSalaryMin' | 'expectedSalaryMax', value: string) => {
    setProfile((prev) => ({ ...prev, preferences: { ...prev.preferences, [field]: value === '' ? null : Number(value) } }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Candidate profile"
        title="Candidate Profile"
        action={(
          <div className="flex flex-wrap gap-2">
            <Link to="/candidate/upload-resume" className="button button-secondary">Upload Resume</Link>
            <Button className="min-h-[54px]" onClick={() => void saveProfile()} disabled={isLoadingProfile || isSavingProfile}>
              {isSavingProfile ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        )}
      />

      {isResumeReview ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#ead6c3] bg-[#fff8f1] p-4 text-sm text-[#61411f]">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#b55e1d]" />
          <div>
            <p className="font-semibold">Profile created from your resume</p>
            <p className="mt-1">Review the extracted information and save your profile when it looks right.</p>
            {profile.resumeEmail ? <p className="mt-2">Resume email found: {profile.resumeEmail}. Your Clyptus account email remains {profileEmail}.</p> : null}
          </div>
        </div>
      ) : null}

      {profileError ? <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{profileError}</p> : null}
      {profileNotice ? <p role="status" className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{profileNotice}</p> : null}
      {isLoadingProfile ? <p className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">Loading your profile...</p> : null}

      <div className="border-b border-[var(--color-border)] py-5 sm:py-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-strong)] text-2xl font-semibold text-[var(--color-primary)]">
              {profile.profilePhotoUrl ? (
                <img crossOrigin="use-credentials" src={candidateService.getProfilePhotoUrl(profile.profilePhotoUrl)} alt={`${profileName} profile`} className="h-full w-full rounded-full object-cover" />
              ) : profileInitial || 'C'}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[var(--color-text)]">{profileName || 'Name not provided'}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{profile.headline || 'Add a professional headline'}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--color-text-secondary)]">
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-[var(--color-primary)]" /> {profile.location || 'Add your location'}</span>
                <span className="inline-flex items-center gap-1"><UserRound className="h-4 w-4 text-[var(--color-primary)]" /> {profileEmail || 'Email not provided'}</span>
                <span className="inline-flex items-center gap-1"><Bell className="h-4 w-4 text-[var(--color-primary)]" /> {profile.phone || 'Add your phone'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline">Edit Profile</Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/70 pt-4">
          <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfilePhotoChange} className="hidden" />
          <button type="button" onClick={() => photoInputRef.current?.click()} disabled={isPhotoSaving} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-orange-300 hover:text-orange-700 disabled:opacity-60">
            <Camera className="h-4 w-4" /> {profile.profilePhotoUrl ? 'Replace photo' : 'Upload photo'}
          </button>
          {profile.profilePhotoUrl ? <button type="button" onClick={() => void removeProfilePhoto()} disabled={isPhotoSaving} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-red-700 disabled:opacity-60"><Trash2 className="h-4 w-4" /> Remove</button> : null}
          <span className="text-xs text-slate-500">JPEG, PNG or WebP, up to 5MB</span>
          {photoError ? <p role="alert" className="w-full text-sm text-red-700">{photoError}</p> : null}
        </div>
      </div>

      <ProfileCompletion value={completion} />
      {profile.profileCompletion.missing.length ? <p className="-mt-3 text-sm text-slate-500">Missing: {profile.profileCompletion.missing.join(' · ')}</p> : null}

      <ProfileSection title="About / Summary" action={<Button variant="outline" size="sm">Edit</Button>}>
        <textarea
          value={profile.summary}
          onChange={(event) => setProfile((prev) => ({ ...prev, summary: event.target.value }))}
          placeholder="Add a professional summary to introduce yourself to recruiters."
          className="min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:bg-white"
        />
      </ProfileSection>

      <ProfileSection title="Contact details" description="Your Clyptus account name and email are authoritative. Review the resume-derived contact details below.">
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={profile.fullName} onChange={(event) => setProfile((prev) => ({ ...prev, fullName: event.target.value }))} placeholder="Full name" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input value={profileEmail} readOnly aria-label="Account email" className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600" />
          <input value={profile.phone} onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Phone" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input value={profile.location} onChange={(event) => setProfile((prev) => ({ ...prev, location: event.target.value }))} placeholder="Location" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <label className="space-y-1 text-xs text-slate-600"><span>Date of birth</span><input type="date" value={profile.dateOfBirth} onChange={(event) => setProfile((prev) => ({ ...prev, dateOfBirth: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></label>
          <input value={profile.linkedin} onChange={(event) => setProfile((prev) => ({ ...prev, linkedin: event.target.value }))} placeholder="LinkedIn URL" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input value={profile.github} onChange={(event) => setProfile((prev) => ({ ...prev, github: event.target.value }))} placeholder="GitHub URL" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input value={profile.portfolio} onChange={(event) => setProfile((prev) => ({ ...prev, portfolio: event.target.value }))} placeholder="Portfolio URL" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm sm:col-span-2" />
        </div>
      </ProfileSection>

      <ProfileSection title="Professional information" description="These structured details help recruiters and future job matching understand your experience.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input value={profile.professional.currentJobTitle} onChange={(event) => setProfile((prev) => ({ ...prev, professional: { ...prev.professional, currentJobTitle: event.target.value } }))} placeholder="Current job title" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input value={profile.professional.currentCompany} onChange={(event) => setProfile((prev) => ({ ...prev, professional: { ...prev.professional, currentCompany: event.target.value } }))} placeholder="Current company" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input value={profile.professional.industry} onChange={(event) => setProfile((prev) => ({ ...prev, professional: { ...prev.professional, industry: event.target.value } }))} placeholder="Industry" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input value={profile.professional.functionalArea} onChange={(event) => setProfile((prev) => ({ ...prev, professional: { ...prev.professional, functionalArea: event.target.value } }))} placeholder="Functional area" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <select value={profile.professional.careerLevel} onChange={(event) => setProfile((prev) => ({ ...prev, professional: { ...prev.professional, careerLevel: event.target.value } }))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
            <option value="">Career level</option>{['STUDENT', 'FRESHER', 'ENTRY_LEVEL', 'MID_LEVEL', 'SENIOR', 'LEAD', 'MANAGER'].map((level) => <option key={level} value={level}>{level.replaceAll('_', ' ')}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2"><input type="number" min="0" max="80" value={profile.professional.totalExperienceYears ?? ''} onChange={(event) => setProfile((prev) => ({ ...prev, professional: { ...prev.professional, totalExperienceYears: event.target.value === '' ? null : Number(event.target.value) } }))} placeholder="Years" className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /><input type="number" min="0" max="11" value={profile.professional.totalExperienceMonths ?? ''} onChange={(event) => setProfile((prev) => ({ ...prev, professional: { ...prev.professional, totalExperienceMonths: event.target.value === '' ? null : Number(event.target.value) } }))} placeholder="Months" className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></div>
          <input type="number" min="0" value={profile.professional.noticePeriodDays ?? ''} onChange={(event) => setProfile((prev) => ({ ...prev, professional: { ...prev.professional, noticePeriodDays: event.target.value === '' ? null : Number(event.target.value) } }))} placeholder="Notice period (days)" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input type="number" min="0" value={profile.professional.currentSalary ?? ''} onChange={(event) => setProfile((prev) => ({ ...prev, professional: { ...prev.professional, currentSalary: event.target.value === '' ? null : Number(event.target.value) } }))} placeholder="Current salary (annual)" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <select value={profile.professional.workAuthorization} onChange={(event) => setProfile((prev) => ({ ...prev, professional: { ...prev.professional, workAuthorization: event.target.value } }))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="">Work authorization</option>{['CITIZEN', 'PERMANENT_RESIDENT', 'WORK_VISA', 'REQUIRES_SPONSORSHIP', 'OTHER'].map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select>
          <select value={profile.professional.willingToRelocate} onChange={(event) => setProfile((prev) => ({ ...prev, professional: { ...prev.professional, willingToRelocate: event.target.value } }))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="">Willing to relocate</option><option value="YES">Yes</option><option value="NO">No</option><option value="MAYBE">Maybe</option></select>
          <input value={profile.professional.relocationLocations.join(', ')} onChange={(event) => setProfile((prev) => ({ ...prev, professional: { ...prev.professional, relocationLocations: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) } }))} placeholder="Preferred relocation locations" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <select value={profile.professional.availability} onChange={(event) => setProfile((prev) => ({ ...prev, professional: { ...prev.professional, availability: event.target.value } }))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="">Availability</option>{['IMMEDIATELY', 'FIFTEEN_DAYS', 'THIRTY_DAYS', 'SIXTY_DAYS', 'NINETY_DAYS', 'CUSTOM'].map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select>
          {profile.professional.availability === 'CUSTOM' ? <input type="number" min="0" value={profile.professional.customNoticePeriodDays ?? ''} onChange={(event) => setProfile((prev) => ({ ...prev, professional: { ...prev.professional, customNoticePeriodDays: event.target.value === '' ? null : Number(event.target.value) } }))} placeholder="Custom notice period (days)" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /> : null}
        </div>
      </ProfileSection>

      <ProfileSection title="Work Experience" action={<Button variant="outline" size="sm" onClick={addExperience}>+ Add experience</Button>}>
        {profile.experience.length === 0 ? (
          <CandidateEmptyState title="No work experience yet" description="Add your roles, responsibilities, and impact to build your story." />
        ) : (
          <div className="space-y-4">
            {profile.experience.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={item.title} onChange={(event) => updateExperience(item.id, { title: event.target.value })} placeholder="Job title" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <input value={item.company} onChange={(event) => updateExperience(item.id, { company: event.target.value })} placeholder="Company" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <select value={item.employmentType} onChange={(event) => updateExperience(item.id, { employmentType: event.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">Employment type</option>{['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY'].map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select>
                  <input value={item.location} onChange={(event) => updateExperience(item.id, { location: event.target.value })} placeholder="Location" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <input value={item.startDate} onChange={(event) => updateExperience(item.id, { startDate: event.target.value })} placeholder="Start date" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <input value={item.endDate} disabled={item.currentlyWorking} onChange={(event) => updateExperience(item.id, { endDate: event.target.value })} placeholder="End date" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100" />
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={item.currentlyWorking}
                    onChange={(event) => updateExperience(item.id, { currentlyWorking: event.target.checked })}
                  />
                  Currently working here
                </label>
                <input value={item.skills.join(', ')} onChange={(event) => updateExperience(item.id, { skills: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })} placeholder="Skills used (comma-separated)" className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                <textarea value={item.description} onChange={(event) => updateExperience(item.id, { description: event.target.value })} placeholder="Describe your responsibilities and achievements." className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                <div className="mt-3 flex justify-end">
                  <Button variant="outline" onClick={() => removeExperience(item.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ProfileSection>

      <ProfileSection title="Skills">
        <div>
          {profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <div key={skill.id ?? skill.skillName} className="inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50/60 py-1 pl-3 pr-1">
                  <span className="text-sm font-medium text-slate-800">{skill.skillName}</span>
                  <button type="button" onClick={() => removeSkill(skill.skillName)} aria-label={`Remove ${skill.skillName}`} className="rounded-full p-1 text-slate-500 hover:bg-white hover:text-red-700"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Add a few skills to highlight your expertise.</p>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={skillInput}
            onChange={(event) => setSkillInput(event.target.value)}
            placeholder="Add a skill"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:bg-white"
          />
          <Button onClick={addSkill}>Add skill</Button>
        </div>
      </ProfileSection>

      <ProfileSection title="Education" action={<Button variant="outline" size="sm" onClick={addEducation}>+ Add education</Button>}>
        {profile.education.length === 0 ? (
          <CandidateEmptyState title="No education added yet" description="Add degrees, certifications, and institutions to strengthen your profile." />
        ) : (
          <div className="space-y-4">
            {profile.education.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={item.institution} onChange={(event) => updateEducation(item.id, { institution: event.target.value })} placeholder="Institution" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <input value={item.degree} onChange={(event) => updateEducation(item.id, { degree: event.target.value })} placeholder="Degree" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <input value={item.fieldOfStudy} onChange={(event) => updateEducation(item.id, { fieldOfStudy: event.target.value })} placeholder="Field of study" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <input value={item.grade} onChange={(event) => updateEducation(item.id, { grade: event.target.value })} placeholder="Grade" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <input value={item.startDate} onChange={(event) => updateEducation(item.id, { startDate: event.target.value })} placeholder="Start date" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <input value={item.endDate} onChange={(event) => updateEducation(item.id, { endDate: event.target.value })} placeholder="End date" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                </div>
                <textarea value={item.description} onChange={(event) => updateEducation(item.id, { description: event.target.value })} placeholder="Notes about your studies" className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                <div className="mt-3 flex justify-end">
                  <Button variant="outline" onClick={() => removeEducation(item.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ProfileSection>

      <ProfileSection title="Projects" action={<Button variant="outline" size="sm" onClick={addProject}>+ Add project</Button>}>
        {profile.projects.length === 0 ? (
          <CandidateEmptyState title="No projects yet" description="Showcase meaningful work, products, and technical wins." />
        ) : (
          <div className="space-y-4">
            {profile.projects.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={item.name} onChange={(event) => updateProject(item.id, { name: event.target.value })} placeholder="Project name" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <input value={item.technologies} onChange={(event) => updateProject(item.id, { technologies: event.target.value })} placeholder="Technologies" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <input value={item.projectUrl} onChange={(event) => updateProject(item.id, { projectUrl: event.target.value })} placeholder="Project URL" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm md:col-span-2" />
                  <input value={item.githubUrl} onChange={(event) => updateProject(item.id, { githubUrl: event.target.value })} placeholder="GitHub URL" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm md:col-span-2" />
                  <input value={item.demoUrl} onChange={(event) => updateProject(item.id, { demoUrl: event.target.value })} placeholder="Demo URL" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm md:col-span-2" />
                  <input value={item.imageUrl} onChange={(event) => updateProject(item.id, { imageUrl: event.target.value })} placeholder="Project image URL" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm md:col-span-2" />
                  <input value={item.startDate} onChange={(event) => updateProject(item.id, { startDate: event.target.value })} placeholder="Start date or year" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <input value={item.endDate} onChange={(event) => updateProject(item.id, { endDate: event.target.value })} placeholder="End date or year" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                </div>
                <textarea value={item.description} onChange={(event) => updateProject(item.id, { description: event.target.value })} placeholder="Project description" className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                <div className="mt-3 flex justify-end">
                  <Button variant="outline" onClick={() => removeProject(item.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ProfileSection>

      <ProfileSection title="Certifications" action={<Button variant="outline" size="sm" onClick={addCertification}>+ Add certification</Button>}>
        {profile.certifications.length === 0 ? (
          <CandidateEmptyState title="No certifications added yet" description="Include credentials, accreditations, and specialized training." />
        ) : (
          <div className="space-y-4">
            {profile.certifications.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={item.name} onChange={(event) => updateCertification(item.id, { name: event.target.value })} placeholder="Certification name" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <input value={item.organisation} onChange={(event) => updateCertification(item.id, { organisation: event.target.value })} placeholder="Issuing organisation" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <input value={item.issueDate} onChange={(event) => updateCertification(item.id, { issueDate: event.target.value })} placeholder="Issue date" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <input value={item.expiryDate} onChange={(event) => updateCertification(item.id, { expiryDate: event.target.value })} placeholder="Expiry date" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <input value={item.credentialId} onChange={(event) => updateCertification(item.id, { credentialId: event.target.value })} placeholder="Credential ID" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <input value={item.credentialUrl} onChange={(event) => updateCertification(item.id, { credentialUrl: event.target.value })} placeholder="Credential URL" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                </div>
                <div className="mt-3 flex justify-end">
                  <Button variant="outline" onClick={() => removeCertification(item.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ProfileSection>

      <ProfileSection title="Languages" action={<Button variant="outline" size="sm" onClick={addLanguage}>+ Add language</Button>}>
        <div className="space-y-3">{profile.languages.map((item) => <div key={item.id ?? item.language} className="grid gap-3 sm:grid-cols-[1fr_220px_auto]">
          <input value={item.language} onChange={(event) => updateLanguage(item.id ?? item.language, { language: event.target.value })} placeholder="Language" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <select value={item.proficiency} onChange={(event) => updateLanguage(item.id ?? item.language, { proficiency: event.target.value as typeof item.proficiency })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">{['BASIC', 'CONVERSATIONAL', 'PROFESSIONAL', 'FLUENT', 'NATIVE'].map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <Button variant="outline" onClick={() => removeLanguage(item.id ?? item.language)}>Delete</Button>
        </div>)}</div>
      </ProfileSection>

      <ProfileSection title="Professional links" action={<Button variant="outline" size="sm" onClick={addLink}>+ Add link</Button>}>
        <div className="space-y-3">{profile.links.map((item) => <div key={item.id ?? item.type} className="grid gap-3 sm:grid-cols-[180px_1fr_1fr_auto]">
          <select value={item.type} onChange={(event) => updateLink(item.id ?? item.type, { type: event.target.value as CandidateLink['type'] })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">{['LINKEDIN', 'GITHUB', 'PERSONAL_WEBSITE', 'PORTFOLIO', 'KAGGLE', 'BEHANCE', 'OTHER'].map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select>
          <input value={item.label} onChange={(event) => updateLink(item.id ?? item.type, { label: event.target.value })} placeholder="Label" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input type="url" value={item.url} onChange={(event) => updateLink(item.id ?? item.type, { url: event.target.value })} placeholder="https://" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <Button variant="outline" onClick={() => removeLink(item.id ?? item.type)}>Delete</Button>
        </div>)}</div>
      </ProfileSection>

      <ProfileSection title="Open to work and recruiter visibility">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-slate-600"><span>Open to work</span><select value={profile.openToWork} onChange={(event) => setProfile((prev) => ({ ...prev, openToWork: event.target.value as CandidateProfile['openToWork'] }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="ACTIVELY_LOOKING">Actively looking</option><option value="OPEN_TO_OPPORTUNITIES">Open to opportunities</option><option value="NOT_LOOKING">Not looking</option></select></label>
          <label className="space-y-1 text-xs text-slate-600"><span>Profile visibility</span><select value={profile.visibility} onChange={(event) => setProfile((prev) => ({ ...prev, visibility: event.target.value as CandidateProfile['visibility'] }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="PUBLIC">Public</option><option value="RECRUITERS_ONLY">Recruiters only</option><option value="PRIVATE">Private</option></select></label>
          {([
            ['Allow recruiters to contact me', 'allowRecruiterContact'],
            ['Show profile in recruiter search', 'showInRecruiterSearch'],
            ['Show resume to recruiters', 'showResumeToRecruiters'],
          ] as const).map(([label, field]) => <label key={field} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><span>{label}</span><input type="checkbox" checked={profile[field]} onChange={(event) => setProfile((prev) => ({ ...prev, [field]: event.target.checked }))} /></label>)}
        </div>
      </ProfileSection>

      <ProfileSection title="Resume" description="Keep your latest resume ready for applications.">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-600">{profile.resume.fileName || 'Resume not added yet'}</p>
            <p className="mt-1 text-xs text-slate-500">{profile.resume.fileType || 'PDF, DOC, DOCX supported'}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/candidate/upload-resume" className="button button-secondary">Upload Resume</Link>
            <Button variant="outline">View Resume</Button>
          </div>
        </div>
      </ProfileSection>

      <ProfileSection title="Job preferences" description="Use comma-separated values to add multiple choices. These numeric ranges are persisted for future job matching.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-xs text-slate-600"><span>Desired job titles</span><input value={profile.preferences.desiredTitles.join(', ')} onChange={(event) => updatePreferenceList('desiredTitles', event.target.value)} placeholder="AI Engineer, ML Engineer" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></label>
          <label className="space-y-1 text-xs text-slate-600"><span>Preferred locations</span><input value={profile.preferences.preferredLocations.join(', ')} onChange={(event) => updatePreferenceList('preferredLocations', event.target.value)} placeholder="Hyderabad, Bangalore, Remote" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></label>
          <label className="space-y-1 text-xs text-slate-600"><span>Work modes</span><input value={profile.preferences.workModes.join(', ')} onChange={(event) => updatePreferenceList('workModes', event.target.value.toUpperCase())} placeholder="REMOTE, HYBRID, ONSITE" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></label>
          <label className="space-y-1 text-xs text-slate-600"><span>Employment types</span><input value={profile.preferences.employmentTypes.join(', ')} onChange={(event) => updatePreferenceList('employmentTypes', event.target.value.toUpperCase())} placeholder="FULL_TIME, INTERNSHIP" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></label>
          <label className="space-y-1 text-xs text-slate-600"><span>Preferred industries</span><input value={profile.preferences.preferredIndustries.join(', ')} onChange={(event) => updatePreferenceList('preferredIndustries', event.target.value)} placeholder="Technology, Healthcare" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></label>
          <label className="space-y-1 text-xs text-slate-600"><span>Functional areas</span><input value={profile.preferences.preferredFunctionalAreas.join(', ')} onChange={(event) => updatePreferenceList('preferredFunctionalAreas', event.target.value)} placeholder="Engineering, Data Science" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" /></label>
          <input type="number" min="0" max="80" step="0.1" value={profile.preferences.experienceMinYears ?? ''} onChange={(event) => updatePreferenceNumber('experienceMinYears', event.target.value)} placeholder="Minimum experience (years)" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input type="number" min="0" max="80" step="0.1" value={profile.preferences.experienceMaxYears ?? ''} onChange={(event) => updatePreferenceNumber('experienceMaxYears', event.target.value)} placeholder="Maximum experience (years)" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input type="number" min="0" value={profile.preferences.expectedSalaryMin ?? ''} onChange={(event) => updatePreferenceNumber('expectedSalaryMin', event.target.value)} placeholder="Minimum annual salary" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input type="number" min="0" value={profile.preferences.expectedSalaryMax ?? ''} onChange={(event) => updatePreferenceNumber('expectedSalaryMax', event.target.value)} placeholder="Maximum annual salary" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
        </div>
      </ProfileSection>
    </div>
  )
}

export function CandidateResumePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [status, setStatus] = useState<'Uploaded' | 'Processing' | 'Parsed' | 'Profile Updated'>('Uploaded')

  const handleFile = (file: File | null) => {
    if (!file) return
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      setError('Unsupported file type. Upload a PDF, DOC, or DOCX file.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('File is too large. Use a file smaller than 8MB.')
      return
    }
    setSelectedFile(file)
    setStatus('Processing')
    setError('')
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Resume" title="Resume Management" action={<Button variant="outline">Upload Resume</Button>} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div
            onDragOver={(event) => { event.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragActive(false)
              handleFile(event.dataTransfer.files?.[0] ?? null)
            }}
            className={`rounded-3xl border-2 border-dashed p-8 text-center ${dragActive ? 'border-orange-400 bg-orange-50' : 'border-slate-300 bg-white'}`}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-orange-600">
              <UploadCloud className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">Upload your resume</h2>
            <p className="mt-2 text-sm text-slate-600">Supported formats: PDF, DOC, DOCX. Maximum size: 8MB.</p>
            <div className="mt-5 flex justify-center gap-3">
              <label className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">
                Choose file
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(event) => handleFile(event.target.files?.[0] ?? null)} />
              </label>
              <Button variant="outline">Replace file</Button>
            </div>
            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          </div>

          {selectedFile ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{selectedFile.name}</p>
                    <p className="text-sm text-slate-500">{selectedFile.type || 'Document file'} • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setSelectedFile(null)}>Remove</Button>
              </div>
              <p className="mt-4 text-sm text-amber-700">Resume selected. Upload will be connected to the backend later.</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Resume preview</h3>
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                <FileText className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm text-slate-600">Your resume preview will appear here once a file is selected.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Resume parsing</h3>
            <div className="mt-4 space-y-4">
              {(['Uploaded', 'Processing', 'Parsed', 'Profile Updated'] as const).map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full ${status === item ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {index < ['Uploaded', 'Processing', 'Parsed', 'Profile Updated'].indexOf(status) ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs">{index + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CandidateJobsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialFilters = {
    search: searchParams.get('query') ?? '',
    location: searchParams.get('location') ?? '',
    workMode: searchParams.get('workMode') ?? '',
    employmentType: searchParams.get('employmentType') ?? '',
    experience: searchParams.get('experience') ?? '',
    salaryRange: searchParams.get('salaryRange') ?? '',
    sort: parseJobSort(searchParams.get('sort')),
  }
  const [search, setSearch] = useState(initialFilters.search)
  const [location, setLocation] = useState(initialFilters.location)
  const [workMode, setWorkMode] = useState(initialFilters.workMode)
  const [employmentType, setEmploymentType] = useState(initialFilters.employmentType)
  const [experience, setExperience] = useState(initialFilters.experience)
  const [salaryRange, setSalaryRange] = useState(initialFilters.salaryRange)
  const [sort, setSort] = useState<'relevance' | 'newest' | 'salary'>(initialFilters.sort)
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<JobPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const { savedJobIds, savingJobIds, error: savedJobsError, toggleSavedJob, retryLoading: retrySavedJobs } = useSavedJobs()

  useEffect(() => {
    const nextFilters = {
      search: searchParams.get('query') ?? '',
      location: searchParams.get('location') ?? '',
      workMode: searchParams.get('workMode') ?? '',
      employmentType: searchParams.get('employmentType') ?? '',
      experience: searchParams.get('experience') ?? '',
      salaryRange: searchParams.get('salaryRange') ?? '',
      sort: parseJobSort(searchParams.get('sort')),
    }
    setSearch(nextFilters.search)
    setLocation(nextFilters.location)
    setWorkMode(nextFilters.workMode)
    setEmploymentType(nextFilters.employmentType)
    setExperience(nextFilters.experience)
    setSalaryRange(nextFilters.salaryRange)
    setSort(nextFilters.sort)
    setFilters(nextFilters)
    setPage(1)
  }, [searchParams])

  useEffect(() => {
    let active = true
    const [salaryMin, salaryMax] = filters.salaryRange ? filters.salaryRange.split('-').map(Number) : []
    const experienceBounds = filters.experience === '5+'
      ? [5, undefined]
      : filters.experience ? filters.experience.split('-').map(Number) : []
    const [experienceMin, experienceMax] = experienceBounds
    void jobService.searchJobs({
      search: filters.search || undefined,
      location: filters.location || undefined,
      workMode: filters.workMode || undefined,
      employmentType: filters.employmentType || undefined,
      experienceMin,
      experienceMax,
      salaryMin,
      salaryMax,
      page,
      limit: 20,
      sort: filters.sort,
    }).then((response) => {
      if (!active) return
      setResult(response)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setError('Unable to load jobs.')
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [filters, page, retry])

  const submitSearch = () => {
    setLoading(true)
    setError('')
    setPage(1)
    const nextFilters = { search, location, workMode, employmentType, experience, salaryRange, sort }
    const params = new URLSearchParams()
    if (search.trim()) params.set('query', search.trim())
    if (location.trim()) params.set('location', location.trim())
    if (workMode) params.set('workMode', workMode)
    if (employmentType) params.set('employmentType', employmentType)
    if (experience) params.set('experience', experience)
    if (salaryRange) params.set('salaryRange', salaryRange)
    if (sort !== 'relevance') params.set('sort', sort)
    setSearchParams(params)
    setFilters(nextFilters)
  }

  const clearFilters = () => {
    setLoading(true)
    setError('')
    setSearch('')
    setLocation('')
    setWorkMode('')
    setEmploymentType('')
    setExperience('')
    setSalaryRange('')
    setSort('relevance')
    setPage(1)
    setFilters({ search: '', location: '', workMode: '', employmentType: '', experience: '', salaryRange: '', sort: 'relevance' })
    setSearchParams({}, { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Jobs" title="Search jobs" />

      <form
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={(event) => { event.preventDefault(); submitSearch() }}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
          <input aria-label="Search jobs, skills, and companies" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jobs, skills, companies" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input aria-label="Location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <select aria-label="Work mode" value={workMode} onChange={(event) => setWorkMode(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
            <option value="">Any work mode</option><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option><option value="ONSITE">On-site</option>
          </select>
          <select aria-label="Employment type" value={employmentType} onChange={(event) => setEmploymentType(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
            <option value="">Any employment type</option><option value="FULL_TIME">Full-time</option><option value="PART_TIME">Part-time</option><option value="CONTRACT">Contract</option><option value="INTERNSHIP">Internship</option><option value="TEMPORARY">Temporary</option>
          </select>
          <Button type="submit">Search</Button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <select aria-label="Experience range" value={experience} onChange={(event) => setExperience(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
            <option value="">Any experience</option><option value="0-2">0–2 years</option><option value="2-5">2–5 years</option><option value="5+">5+ years</option>
          </select>
          <select aria-label="Salary range" value={salaryRange} onChange={(event) => setSalaryRange(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
            <option value="">Any salary</option><option value="700000-1200000">₹7–12 LPA</option><option value="1000000-1600000">₹10–16 LPA</option><option value="1500000-2200000">₹15–22 LPA</option>
          </select>
          <select aria-label="Sort jobs" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
            <option value="relevance">Most relevant</option><option value="newest">Newest</option><option value="salary">Highest salary</option>
          </select>
        </div>
      </form>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{loading ? 'Searching jobs…' : `${(result?.total ?? 0).toLocaleString()} opportunities`}</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/candidate/saved-jobs')}>Saved jobs</Button>
          <Button type="button" variant="outline" onClick={clearFilters}>Clear filters</Button>
        </div>
        </div>

        {savedJobsError ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{savedJobsError}<button type="button" className="ml-2 font-semibold underline" onClick={retrySavedJobs}>Retry</button></p> : null}

        {loading ? (
          <div className="space-y-3" aria-label="Loading jobs">
            {[1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error} <button type="button" className="ml-2 font-semibold underline" onClick={() => { setLoading(true); setError(''); setRetry((value) => value + 1) }}>Retry</button>
          </div>
        ) : !result?.items.length ? (
          <CandidateEmptyState title="No jobs found" description="Try broadening your search or clear some filters." />
        ) : (
          <>
            <div className="space-y-3">
              {result.items.map((job) => (
                <CandidateJobCard key={job.id} job={toCandidateJobRecord(job)} saved={savedJobIds.has(job.id)} saving={savingJobIds.has(job.id)} onToggleSave={() => void toggleSavedJob(job.id)} onView={() => navigate(`/candidate/jobs/${job.id}`)} />
              ))}
            </div>
            {result.totalPages > 1 ? (
              <nav aria-label="Job search pages" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <Button type="button" variant="outline" disabled={page <= 1} onClick={() => { setLoading(true); setPage((value) => value - 1) }}>Previous</Button>
                <span className="text-sm text-slate-600">Page {result.page} of {result.totalPages}</span>
                <Button type="button" variant="outline" disabled={page >= result.totalPages} onClick={() => { setLoading(true); setPage((value) => value + 1) }}>Next</Button>
              </nav>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

export function CandidateJobDetailsPage() {
  const { id } = useParams()
  const { savedJobIds, savingJobIds, error: savedJobsError, toggleSavedJob } = useSavedJobs()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [application, setApplication] = useState<ApplicationApiRecord | null>(null)
  const [applying, setApplying] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setError('')
    void Promise.all([
      jobService.getJobById(id),
      candidateJourneyService.listApplications(),
    ]).then(([jobResult, applications]) => {
      if (!active) return
      setJob(jobResult ?? null)
      setApplication(applications.find((item) => item.jobId === id) ?? null)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setError('We could not load this job right now. Please try again.')
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [id])

  const handleApply = async () => {
    if (!id) return
    setApplying(true)
    setActionMessage('')
    try {
      const profile = await candidateService.getProfile()
      if (!profile.latestResume?.id) {
        setActionMessage('Upload a resume before applying to this job.')
        return
      }
      const created = await candidateJourneyService.createApplication(id, profile.latestResume.id)
      setApplication(created)
      setActionMessage('Your application was submitted.')
    } catch (applyError) {
      const responseData = typeof applyError === 'object' && applyError !== null && 'response' in applyError
        ? (applyError as { response?: { data?: { message?: string | string[] } } }).response?.data
        : undefined
      const message = responseData?.message
      setActionMessage(Array.isArray(message) ? message.join(' ') : message ?? 'We could not submit your application.')
    } finally {
      setApplying(false)
    }
  }

  if (!id) {
    return (
      <CandidateEmptyState
        title="Job details will appear here when a job is selected."
        description="Pick a role from your search results to view responsibilities, salary, requirements, and application status."
      />
    )
  }

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading job details…</div>
  }

  if (error || !job) {
    return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error || 'This job could not be found.'}</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Job details" title={job.title} action={<Button type="button" variant="outline" disabled={savingJobIds.has(job.id)} aria-pressed={savedJobIds.has(job.id)} onClick={() => void toggleSavedJob(job.id)}>{savingJobIds.has(job.id) ? 'Saving…' : savedJobIds.has(job.id) ? 'Saved' : 'Save job'}</Button>} />
      {savedJobsError ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{savedJobsError}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{job.companyName}</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600">{job.employmentType}</div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1"><BriefcaseBusiness className="h-3.5 w-3.5" /> {job.workMode}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1"><CalendarDays className="h-3.5 w-3.5" /> {job.postedAt}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Job description</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{job.description}</p>
          </div>

          {job.responsibilities.length ? <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Responsibilities</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {job.responsibilities.map((item) => <li key={item} className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-orange-500" /> {item}</li>)}
            </ul>
          </div> : null}

          {job.requirements.length ? <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Requirements</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {job.requirements.map((item) => <li key={item} className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-slate-400" /> {item}</li>)}
            </ul>
          </div> : null}

          {job.skills.length ? <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Skills</h3>
            <div className="mt-4 flex flex-wrap gap-2">{job.skills.map((skill) => <span key={skill} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">{skill}</span>)}</div>
          </div> : null}
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-24 xl:h-fit">
          <div className="space-y-5">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Salary</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{job.salary}</p>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p className="flex items-center justify-between"><span>Work mode</span><span className="font-medium text-slate-900">{job.workMode}</span></p>
              <p className="flex items-center justify-between"><span>Employment type</span><span className="font-medium text-slate-900">{job.employmentType}</span></p>
              <p className="flex items-center justify-between"><span>Experience</span><span className="font-medium text-slate-900">{job.experience}</span></p>
              <p className="flex items-center justify-between"><span>Posted</span><span className="font-medium text-slate-900">{job.postedAt}</span></p>
            </div>
            <div className="space-y-3">
              <Button className="w-full" disabled={applying || Boolean(application)} onClick={() => void handleApply()}>
                {application ? 'Applied' : applying ? 'Submitting…' : 'Apply now'}
              </Button>
              <Button type="button" variant="outline" className="w-full" disabled={savingJobIds.has(job.id)} aria-pressed={savedJobIds.has(job.id)} onClick={() => void toggleSavedJob(job.id)}>{savingJobIds.has(job.id) ? 'Saving…' : savedJobIds.has(job.id) ? 'Saved' : 'Save job'}</Button>
            </div>
            {application ? <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">You have already applied to this job. Application status: {applicationStatusLabels[application.status]}</p> : null}
            {actionMessage ? <p role="status" className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{actionMessage}</p> : null}
          </div>
        </aside>
      </div>
    </div>
  )
}

export function CandidateSavedJobsPage() {
  const navigate = useNavigate()
  const { savedJobs, loading, error, retryLoading, savingJobIds, toggleSavedJob } = useSavedJobs()
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Saved jobs" title="Saved jobs" action={<Button type="button" variant="outline" onClick={() => navigate('/candidate/jobs')}>Explore jobs</Button>} />
      {loading ? (
        <div className="space-y-3" aria-label="Loading saved jobs">{[1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}<button type="button" onClick={retryLoading} className="ml-2 font-semibold underline">Retry</button></div>
      ) : savedJobs.length === 0 ? (
        <CandidateEmptyState title="No saved jobs" description="Jobs you save will appear here." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {savedJobs.map((job) => <CandidateJobCard key={job.id} job={toCandidateJobRecord(job)} saved saving={savingJobIds.has(job.id)} onToggleSave={() => void toggleSavedJob(job.id)} onView={() => navigate(`/candidate/jobs/${job.id}`)} />)}
        </div>
      )}
    </div>
  )
}

export function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationApiRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void candidateJourneyService.listApplications().then((results) => {
      if (!active) return
      setApplications(results)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setError('We could not load your applications. Please try again.')
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Applications" title="My applications" />
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading applications…</div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      ) : applications.length === 0 ? (
        <CandidateEmptyState title="No applications yet" description="Applications you submit will appear here." />
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <div key={application.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">{application.companyName}</p>
                  <h3 className="text-xl font-semibold text-slate-900">{application.jobTitle}</h3>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[applicationStatusLabels[application.status]] || 'bg-slate-100 text-slate-700'}`}>
                  {applicationStatusLabels[application.status]}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                <span>Applied {formatJourneyDate(application.appliedAt)}</span>
                {application.resume ? <span>Resume: {application.resume.originalFileName}</span> : <span>No resume is currently attached.</span>}
              </div>
              <div className="mt-4 flex justify-end">
                <Link to={`/candidate/applications/${application.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-orange-700">
                  View details <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function CandidateApplicationDetailPage() {
  const { id } = useParams()
  const [application, setApplication] = useState<ApplicationApiRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    let active = true
    void candidateJourneyService.getApplication(id).then((result) => {
      if (!active) return
      setApplication(result)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setError('We could not load this application. It may not exist or may not be available to your account.')
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [id])

  if (!id) {
    return <CandidateEmptyState title="No application selected" description="Open an application to review the timeline, recruiter notes, and next steps." />
  }

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading application…</div>
  }

  if (error || !application) {
    return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error || 'Application not found.'}</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Application details" title={application.jobTitle} />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Application timeline</h3>
          <div className="mt-5 space-y-4">
            {applicationProgression.map((status, index) => {
              const currentIndex = applicationProgression.indexOf(application.status)
              const reached = currentIndex >= 0 && index <= currentIndex
              const current = status === application.status
              return (
                <div key={status} className="flex items-start gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${current ? 'bg-orange-500 text-white' : reached ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-500'}`}>
                    {index + 1}
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <p className={`font-medium ${current ? 'text-orange-800' : 'text-slate-800'}`}>{applicationStatusLabels[status]}</p>
                    {status === 'APPLIED' ? <p className="mt-1 text-sm text-slate-500">{formatJourneyDate(application.appliedAt)}</p> : null}
                    {current ? <p className="mt-1 text-sm text-slate-500">Current status</p> : null}
                  </div>
                </div>
              )
            })}
            {application.status === 'REJECTED' ? (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-700">!</div>
                <div className="border-l border-slate-200 pl-4">
                  <p className="font-medium text-red-700">Rejected</p>
                  <p className="mt-1 text-sm text-slate-500">Current status</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Application information</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Job title: {application.jobTitle}</p>
              <p>Company: {application.companyName}</p>
              <p>Location: {application.location}</p>
              <p>Resume used: {application.resume?.originalFileName ?? 'No resume attached'}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Interview and offer</h3>
            {application.interview ? (
              <p className="mt-3 text-sm text-slate-600">
                Interview: {application.interview.status.toLowerCase()} · {formatJourneyDate(application.interview.scheduledAt)}
              </p>
            ) : <p className="mt-3 text-sm text-slate-500">No interview has been scheduled.</p>}
            {application.offers?.length ? (
              <p className="mt-2 text-sm text-slate-600">Offer status: {application.offers.map((offer) => offer.status.toLowerCase()).join(', ')}</p>
            ) : <p className="mt-2 text-sm text-slate-500">No offer has been issued.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CandidateInterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewApiRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void candidateJourneyService.listInterviews().then((results) => {
      if (!active) return
      setInterviews(results)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setError('We could not load your interviews. Please try again.')
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Interviews" title="Interviews" />
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading interviews…</div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      ) : interviews.length === 0 ? (
        <CandidateEmptyState title="No interviews scheduled" description="Interview invitations will appear here." />
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => (
            <article key={interview.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-sm text-slate-500">{interview.companyName}</p><h2 className="mt-1 text-xl font-semibold text-slate-900">{interview.jobTitle}</h2></div>
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">{interview.status.toLowerCase()}</span>
              </div>
              <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
                <p><span className="block text-xs text-slate-500">When</span><span className="mt-1 block font-medium">{formatJourneyDate(interview.scheduledAt)}</span></p>
                <p><span className="block text-xs text-slate-500">Location</span><span className="mt-1 block font-medium">{interview.location}</span></p>
                {interview.interviewerName ? <p><span className="block text-xs text-slate-500">Interviewer</span><span className="mt-1 block font-medium">{interview.interviewerName}</span></p> : null}
              </div>
              {interview.notes ? <p className="mt-4 text-sm leading-6 text-slate-600">{interview.notes}</p> : null}
              <div className="mt-4 flex flex-wrap gap-3">
                {interview.meetingLink ? <a className="inline-flex h-10 items-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" href={interview.meetingLink} target="_blank" rel="noreferrer">Join interview</a> : null}
                <Link className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50" to={`/candidate/applications/${interview.applicationId}`}>View application</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export function CandidateOffersPage() {
  const [offers, setOffers] = useState<OfferApiRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [responseError, setResponseError] = useState('')
  const [respondingTo, setRespondingTo] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void candidateJourneyService.listOffers().then((results) => {
      if (!active) return
      setOffers(results)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setLoadError('We could not load your offers. Please try again.')
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const respondToOffer = async (offerId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setRespondingTo(offerId)
    setResponseError('')
    try {
      const updated = await candidateJourneyService.respondToOffer(offerId, status)
      setOffers((current) => current.map((offer) => offer.id === offerId ? { ...offer, status: updated.status } : offer))
    } catch {
      setResponseError('We could not save your offer response. Please try again.')
    } finally {
      setRespondingTo(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Offers" title="Your offers" />
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading offers…</div>
      ) : loadError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{loadError}</div>
      ) : offers.length === 0 ? (
        <CandidateEmptyState title="No offers yet" description="Your offers will appear here when a company reaches out with next steps." />
      ) : (
        <div className="space-y-4">
          {responseError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{responseError}</p> : null}
          {offers.map((offer) => (
            <article key={offer.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-sm text-slate-500">{offer.companyName}</p><h2 className="mt-1 text-xl font-semibold text-slate-900">{offer.title} · {offer.jobTitle}</h2></div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${offer.status === 'PENDING' ? 'bg-amber-50 text-amber-800' : offer.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{offer.status.toLowerCase()}</span>
              </div>
              <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                <p><span className="block text-xs text-slate-500">Annual salary</span><span className="mt-1 block font-semibold text-slate-950">{offer.salary == null ? 'Not specified' : `₹${offer.salary.toLocaleString('en-IN')}`}</span></p>
                <p><span className="block text-xs text-slate-500">Joining date</span><span className="mt-1 block font-medium text-slate-800">{formatJourneyDate(offer.joiningDate)}</span></p>
              </div>
              {offer.message ? <p className="mt-4 border-l-2 border-orange-300 pl-3 text-sm leading-6 text-slate-600">{offer.message}</p> : null}
              {offer.status === 'ACCEPTED' ? <p role="status" className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">Congratulations! You have been hired.</p> : null}
              {offer.status === 'PENDING' ? (
                <div className="mt-4 flex gap-3">
                  <Button type="button" disabled={respondingTo === offer.id} onClick={() => void respondToOffer(offer.id, 'ACCEPTED')}>{respondingTo === offer.id ? 'Saving…' : 'Accept offer'}</Button>
                  <Button type="button" variant="outline" disabled={respondingTo === offer.id} onClick={() => void respondToOffer(offer.id, 'REJECTED')}>Reject offer</Button>
                </div>
              ) : null}
              <div className="mt-4"><Link className="text-sm font-semibold text-orange-800 hover:underline" to={`/candidate/applications/${offer.applicationId}`}>View application</Link></div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export function CandidateMessagesPage() {
  const [conversations] = useState([])
  const [message, setMessage] = useState('')

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Messages" title="Messages" />
      {conversations.length === 0 ? (
        <CandidateEmptyState title="No messages yet" description="Your recruiter conversations will appear here." />
      ) : (
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm xl:grid-cols-[320px_1fr]">
          <div className="space-y-3 border-r border-slate-200 pr-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-500" />
              <input placeholder="Search conversations" className="w-full border-0 bg-transparent text-sm outline-none" />
            </div>
          </div>
          <div className="flex min-h-[520px] flex-col">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <p className="font-medium text-slate-900">Recruiter</p>
                <p className="text-sm text-slate-500">Company</p>
              </div>
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">Unread</span>
            </div>
            <div className="flex flex-1 flex-col justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <MessageSquareText className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-3 text-sm text-slate-600">Select a conversation to view messages.</p>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-slate-200 pt-4">
              <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none" />
              <Button>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function CandidateNotificationsPage() {
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'All'>('All')
  const [notifications] = useState<NotificationItem[]>([])

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Notifications" title="Notifications" action={<Button variant="outline">Mark all as read</Button>} />
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {['All', ...notificationCategories].map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category as NotificationCategory | 'All')}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${selectedCategory === category ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {notifications.length === 0 ? (
        <CandidateEmptyState title="You're all caught up." description="No new notifications at the moment." />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className={`rounded-2xl border p-4 ${notification.read ? 'border-slate-200 bg-white' : 'border-orange-200 bg-orange-50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{notification.description}</p>
                </div>
                <span className="text-xs text-slate-500">{notification.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function CandidateJobAlertsPage() {
  const [alerts, setAlerts] = useState<JobAlert[]>([])
  const [form, setForm] = useState({ title: '', location: '', skills: '', salary: '', workMode: '', employmentType: '', frequency: 'Weekly' })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.title.trim()) return

    const nextAlert: JobAlert = {
      id: Date.now().toString(),
      title: form.title,
      location: form.location,
      skills: form.skills,
      salary: form.salary,
      workMode: form.workMode,
      employmentType: form.employmentType,
      frequency: form.frequency as JobAlert['frequency'],
      active: true,
    }

    setAlerts((prev) => [nextAlert, ...prev])
    setForm({ title: '', location: '', skills: '', salary: '', workMode: '', employmentType: '', frequency: 'Weekly' })
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Job alerts" title="Job alerts" action={<Button variant="outline">Create alert</Button>} />
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Job title" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} placeholder="Location" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input value={form.skills} onChange={(event) => setForm((prev) => ({ ...prev, skills: event.target.value }))} placeholder="Skills" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input value={form.salary} onChange={(event) => setForm((prev) => ({ ...prev, salary: event.target.value }))} placeholder="Salary" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input value={form.workMode} onChange={(event) => setForm((prev) => ({ ...prev, workMode: event.target.value }))} placeholder="Work mode" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input value={form.employmentType} onChange={(event) => setForm((prev) => ({ ...prev, employmentType: event.target.value }))} placeholder="Employment type" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <select value={form.frequency} onChange={(event) => setForm((prev) => ({ ...prev, frequency: event.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm md:col-span-2">
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Instant">Instant</option>
          </select>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit">Save alert</Button>
          </div>
        </form>
      </div>

      {alerts.length === 0 ? (
        <CandidateEmptyState title="No job alerts yet" description="Create an alert to get notified about relevant opportunities." />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{alert.title || 'Untitled alert'}</p>
                  <p className="text-sm text-slate-500">{alert.location || 'Location not set'} • {alert.frequency}</p>
                </div>
                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{alert.active ? 'Active' : 'Paused'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function CandidateAIAssistantPage() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const suggestions = ['Improve my resume', 'Analyze my skills', 'Prepare for an interview', 'Improve my profile']

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="AI assistant" title="AI Assistant" />
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        {!selectedAction ? (
          <>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">How can I help with your career?</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setSelectedAction(suggestion)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-sm font-medium text-slate-700 transition hover:border-orange-200 hover:bg-orange-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-orange-500" />
            <p className="mt-3 text-lg font-semibold text-slate-900">AI Assistant will be connected when the AI service is available.</p>
            <Button className="mt-4" variant="outline" onClick={() => setSelectedAction(null)}>Back</Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function CandidateProfileViewsPage() {
  const [views] = useState([])
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Profile views" title="Profile views" />
      {views.length === 0 ? (
        <CandidateEmptyState title="No profile views yet" description="Your profile activity will appear here once recruiters start engaging with your profile." />
      ) : null}
    </div>
  )
}

export function CandidateSettingsPage() {
  const [settings, setSettings] = useState({
    emailPreferences: true,
    jobAlerts: true,
    messageNotifications: true,
    interviewNotifications: true,
    offerNotifications: true,
  })

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Settings" title="Settings" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ProfileSection title="Account">
            <div className="space-y-3">
              <input placeholder="Email address" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
              <input placeholder="Phone number" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            </div>
          </ProfileSection>
          <ProfileSection title="Privacy">
            <Link to="/candidate/profile" className="text-sm font-medium text-[var(--color-primary)] hover:underline">Manage profile visibility and recruiter contact settings</Link>
          </ProfileSection>
          <ProfileSection title="Security">
            <Button variant="outline" className="w-full justify-center">Change password</Button>
          </ProfileSection>
        </div>
        <div className="space-y-6">
          <ProfileSection title="Notifications">
            <div className="space-y-3 text-sm text-slate-600">
              {[
                ['Email preferences', 'emailPreferences'],
                ['Job alert preferences', 'jobAlerts'],
                ['Message notifications', 'messageNotifications'],
                ['Interview notifications', 'interviewNotifications'],
                ['Offer notifications', 'offerNotifications'],
              ].map(([label, key]) => (
                <label key={label} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={settings[key as keyof typeof settings]}
                    onChange={(event) => setSettings((prev) => ({ ...prev, [key]: event.target.checked }))}
                  />
                </label>
              ))}
            </div>
          </ProfileSection>
          <ProfileSection title="Job preferences">
            <Link to="/candidate/profile" className="text-sm font-medium text-[var(--color-primary)] hover:underline">Manage roles, salary, location, and work preferences</Link>
          </ProfileSection>
        </div>
      </div>
    </div>
  )
}

export function CandidateHomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [applicationCount, setApplicationCount] = useState<number | null>(null)
  const [activeApplications, setActiveApplications] = useState<ApplicationApiRecord[]>([])
  const [applicationsError, setApplicationsError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLocation, setSearchLocation] = useState('')
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(true)
  const [recommendationsError, setRecommendationsError] = useState('')
  const [recommendationsRetry, setRecommendationsRetry] = useState(0)
  const { savedJobs, loading: savedJobsLoading, savedJobIds, savingJobIds, error: savedJobsError, toggleSavedJob } = useSavedJobs()

  useEffect(() => {
    let isActive = true
    void candidateService.getProfile().then((response) => {
      if (isActive) {
        setProfileCompletion(response.profile.profileCompletion.percentage)
        setProfileLoading(false)
      }
    }).catch(() => {
      if (isActive) {
        setProfileError('Profile completion could not be loaded.')
        setProfileLoading(false)
      }
    })
    return () => { isActive = false }
  }, [])

  useEffect(() => {
    let isActive = true
    void candidateJourneyService.listApplications().then((applications) => {
      if (!isActive) return
      setApplicationCount(applications.length)
      setActiveApplications(applications.filter((application) => !['HIRED', 'REJECTED'].includes(application.status)).slice(0, 3))
    }).catch(() => {
      if (isActive) setApplicationsError('Application progress could not be loaded.')
    })
    return () => { isActive = false }
  }, [])

  useEffect(() => {
    let isActive = true
    void jobService.getRecommendedJobs({ page: 1, limit: 3 }).then((response) => {
      if (!isActive) return
      setRecommendedJobs(response.items)
      setRecommendationsLoading(false)
    }).catch(() => {
      if (!isActive) return
      setRecommendationsError('Unable to load recommended jobs.')
      setRecommendationsLoading(false)
    })
    return () => { isActive = false }
  }, [recommendationsRetry])

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[28px] bg-slate-950 px-5 py-8 text-white sm:px-8 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">Your next opportunity starts here</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Good to see you, {user?.name?.split(' ')[0] || 'there'}.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Search roles that fit your skills, experience, and the way you want to work.</p>
          <form className="mt-6 grid gap-2 rounded-2xl bg-white p-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.65fr)_auto]" onSubmit={(event) => {
            event.preventDefault()
            const params = new URLSearchParams()
            if (searchQuery.trim()) params.set('query', searchQuery.trim())
            if (searchLocation.trim()) params.set('location', searchLocation.trim())
            const queryString = params.toString()
            navigate(`/candidate/jobs${queryString ? `?${queryString}` : ''}`)
          }}>
            <label className="flex min-w-0 items-center gap-2 rounded-xl px-3 sm:border-r sm:border-slate-200">
              <Search className="h-4 w-4 shrink-0 text-orange-700" />
              <span className="sr-only">Role, skill, or company</span>
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Role, skill, or company" className="h-11 min-w-0 flex-1 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
            </label>
            <label className="flex min-w-0 items-center gap-2 rounded-xl px-3">
              <MapPin className="h-4 w-4 shrink-0 text-orange-700" />
              <span className="sr-only">Location</span>
              <input value={searchLocation} onChange={(event) => setSearchLocation(event.target.value)} placeholder="Location or remote" className="h-11 min-w-0 flex-1 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
            </label>
            <Button type="submit" className="h-11 px-6">Find jobs</Button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
            <span>Popular:</span>
            {['AI/ML', 'Python', 'React', 'Data Analyst'].map((term) => <button key={term} type="button" onClick={() => { setSearchQuery(term); navigate(`/candidate/jobs?query=${encodeURIComponent(term)}`) }} className="rounded-full border border-white/20 px-2.5 py-1 transition hover:border-orange-300 hover:text-white">{term}</button>)}
          </div>
        </div>
      </section>

      <section aria-label="Job search overview" className="grid gap-3 sm:grid-cols-3">
        <Link to="/candidate/applications" className="rounded-2xl border border-[var(--color-border)] bg-white p-4 transition hover:border-orange-300">
          <p className="text-sm text-slate-500">Applications</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{applicationCount ?? '—'}</p>
          <p className="mt-1 text-xs text-slate-500">{applicationsError || 'Submitted applications'}</p>
        </Link>
        <Link to="/candidate/saved-jobs" className="rounded-2xl border border-[var(--color-border)] bg-white p-4 transition hover:border-orange-300">
          <p className="text-sm text-slate-500">Saved jobs</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{savedJobsLoading ? '—' : savedJobs.length}</p>
          <p className="mt-1 text-xs text-slate-500">{savedJobsError || 'Roles you want to revisit'}</p>
        </Link>
        <Link to="/candidate/profile" className="rounded-2xl border border-[var(--color-border)] bg-white p-4 transition hover:border-orange-300">
          <p className="text-sm text-slate-500">Profile strength</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{profileLoading || profileError ? '—' : `${profileCompletion}%`}</p>
          <p className="mt-1 text-xs text-slate-500">{profileError || 'Make your experience easier to discover'}</p>
        </Link>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div><p className="eyebrow">Profile strength</p><h2 className="mt-1 text-xl font-semibold text-slate-950">Make your profile stand out</h2></div>
            <Link to="/candidate/jobs" className="text-sm font-semibold text-orange-800">Explore all</Link>
          </div>
          {profileLoading ? <div className="h-12 animate-pulse rounded-xl bg-slate-100" aria-label="Loading profile completion" /> : profileError ? <p role="alert" className="text-sm text-red-700">{profileError}</p> : <ProfileCompletion value={profileCompletion} />}
          <p className="text-sm text-[var(--color-text-secondary)]">A complete profile gives hiring teams a clearer view of your experience.</p>
          <Link to="/candidate/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]">Improve your profile <ChevronRight className="h-4 w-4" /></Link>
        </section>
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div><p className="eyebrow">Keep moving</p><h2 className="mt-1 text-xl font-semibold text-slate-950">Application progress</h2></div>
            <Link to="/candidate/applications" className="text-sm font-semibold text-orange-800">View all</Link>
          </div>
          {applicationsError ? <p role="alert" className="mt-4 text-sm text-red-700">{applicationsError}</p> : activeApplications.length ? (
            <div className="mt-4 divide-y divide-slate-100">
              {activeApplications.map((application) => <Link key={application.id} to={`/candidate/applications/${application.id}`} className="block py-3 first:pt-0 last:pb-0">
                <p className="truncate text-sm font-semibold text-slate-900">{application.jobTitle}</p>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500"><span className="truncate">{application.companyName}</span><span className="shrink-0 rounded-full bg-orange-50 px-2 py-1 font-medium text-orange-800">{applicationStatusLabels[application.status]}</span></div>
              </Link>)}
            </div>
          ) : <p className="mt-4 text-sm text-slate-500">{applicationCount === null ? 'Loading your application progress…' : 'Applications you submit will be tracked here.'}</p>}
        </section>
      </div>
      <section className="space-y-4" aria-labelledby="recommended-jobs-title">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Picked for your profile</p>
            <h2 id="recommended-jobs-title" className="mt-1 text-xl font-semibold text-[var(--color-text)]">Recommended jobs</h2>
          </div>
          <Link to="/candidate/jobs" className="text-sm font-semibold text-[var(--color-primary)]">Search all jobs</Link>
        </div>
        {recommendationsLoading ? (
          <div className="grid gap-3 lg:grid-cols-3" aria-label="Loading recommendations">
            {[1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]" />)}
          </div>
        ) : recommendationsError ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {recommendationsError} <button type="button" className="ml-2 font-semibold underline" onClick={() => { setRecommendationsLoading(true); setRecommendationsError(''); setRecommendationsRetry((value) => value + 1) }}>Retry</button>
          </p>
        ) : recommendedJobs.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-secondary)]">
            <p>{profileCompletion < 100 ? 'We’re still learning your preferences.' : 'No new recommendations are available right now.'}</p>
            <Link to={profileCompletion < 100 ? '/candidate/profile' : '/candidate/jobs'} className="mt-2 inline-block font-semibold text-[var(--color-primary)]">
              {profileCompletion < 100 ? 'Complete your profile' : 'Browse all jobs'}
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            {recommendedJobs.map((job) => (
              <CandidateJobCard key={job.id} job={toCandidateJobRecord(job)} saved={savedJobIds.has(job.id)} saving={savingJobIds.has(job.id)} onToggleSave={() => void toggleSavedJob(job.id)} onView={() => navigate(`/candidate/jobs/${job.id}`)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
