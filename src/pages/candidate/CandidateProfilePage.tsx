import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, FileText, MapPin, Pencil, Plus, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { ProfileSection } from '../../components/candidate/ProfileSection'
import { StandOutSection } from '../../components/candidate/StandOutSection'
import { useAuth } from '../../components/common/AuthContext'
import { candidateService, type CandidateProfileResponse, type CandidateProfileUpdate, type ParsedResumeData } from '../../services/candidateService'
import type { CandidateEducation, CandidateExperience, CandidateProfile, CandidateProject } from '../../types/candidate.types'
import { makeParsedResumeData, mapCandidateProfile } from '../../utils/candidateProfileMapper'

const inputClass = 'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
const textareaClass = 'min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
const roleOptions = [
  'Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
  'Python Developer', 'AI Engineer', 'ML Engineer', 'Data Scientist', 'Gen AI Developer',
  'DevOps Engineer', 'Data Analyst', 'QA Engineer',
]
const locationOptions = [
  'Hyderabad', 'Bengaluru', 'Chennai', 'Pune', 'Mumbai', 'Delhi NCR',
  'Gurugram', 'Noida', 'Kolkata', 'Ahmedabad', 'Remote',
]
const salaryRanges = [
  { label: '₹0–3 LPA', min: 0, max: 300_000 },
  { label: '₹3–5 LPA', min: 300_000, max: 500_000 },
  { label: '₹5–8 LPA', min: 500_000, max: 800_000 },
  { label: '₹8–12 LPA', min: 800_000, max: 1_200_000 },
  { label: '₹12–20 LPA', min: 1_200_000, max: 2_000_000 },
  { label: '₹20+ LPA', min: 2_000_000, max: null },
]
const employmentTypes = [
  ['FULL_TIME', 'Full-time'], ['PART_TIME', 'Part-time'], ['INTERNSHIP', 'Internship'],
  ['CONTRACT', 'Contract'], ['TEMPORARY', 'Freelance'],
]
const workModes = [['ONSITE', 'On-site'], ['HYBRID', 'Hybrid'], ['REMOTE', 'Remote']]
const experienceTypes = ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'TEMPORARY']
const languageLevels = ['BASIC', 'CONVERSATIONAL', 'PROFESSIONAL', 'FLUENT', 'NATIVE']
const availabilityOptions = [
  ['IMMEDIATELY', 'Immediately', 0], ['FIFTEEN_DAYS', '15 days', 15],
  ['THIRTY_DAYS', '30 days', 30], ['SIXTY_DAYS', '60 days', 60],
  ['NINETY_DAYS', '90 days', 90], ['CUSTOM', 'Custom', null],
] as const

function availabilityFromNoticeDays(days: number | null) {
  if (days == null) return ''
  return ({ 0: 'IMMEDIATELY', 15: 'FIFTEEN_DAYS', 30: 'THIRTY_DAYS', 60: 'SIXTY_DAYS', 90: 'NINETY_DAYS' } as Record<number, string>)[days] ?? 'CUSTOM'
}

type EditableSectionProps = {
  title: string
  editing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  showActions?: boolean
  children: React.ReactNode
}

type ProfileSectionKey = 'about' | 'contact' | 'career' | 'skills' | 'education' | 'experience' | 'projects' | 'certifications' | 'languages' | 'links' | 'preferences' | 'all'

function EditableSection({ title, editing, onEdit, onSave, onCancel, saving, showActions = true, children }: EditableSectionProps) {
  return (
    <ProfileSection title={title} action={!editing ? <button type="button" onClick={onEdit} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"><Pencil className="h-3.5 w-3.5" />Edit</button> : undefined}>
      {children}
      {editing && showActions ? <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
        <Button type="button" disabled={saving} onClick={onSave}>{saving ? 'Saving…' : 'Save section'}</Button>
      </div> : null}
    </ProfileSection>
  )
}

function displayValue(value: string | number | null | undefined, fallback = 'Not added') {
  return value === '' || value == null ? <span className="text-slate-400">{fallback}</span> : value
}

function formatDate(value: string) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(date)
}

function splitList(value: string) {
  return value.split(/[,\n]+/).map((item) => item.trim()).filter(Boolean)
}

function profileUpdate(
  profile: CandidateProfile,
  sourceParsedData: ParsedResumeData | null,
  completeOnboarding: boolean,
  originalOpenToWork: CandidateProfile['openToWork'],
): CandidateProfileUpdate {
  const expectedRange = salaryRanges.find((range) =>
    range.min === profile.preferences.expectedSalaryMin && range.max === profile.preferences.expectedSalaryMax)
  const preferencePayload = {
    desiredTitles: profile.preferences.desiredTitles,
    preferredLocations: profile.preferences.preferredLocations,
    workModes: profile.preferences.workModes,
    employmentTypes: profile.preferences.employmentTypes,
    preferredIndustries: profile.preferences.preferredIndustries,
    preferredFunctionalAreas: profile.preferences.preferredFunctionalAreas,
    experienceMinYears: profile.preferences.experienceMinYears,
    experienceMaxYears: profile.preferences.experienceMaxYears,
    expectedSalaryMin: expectedRange?.min ?? profile.preferences.expectedSalaryMin,
    expectedSalaryMax: expectedRange ? expectedRange.max : profile.preferences.expectedSalaryMax,
  }

  return {
    fullName: profile.fullName,
    phone: profile.phone,
    gender: profile.gender || undefined,
    dateOfBirth: profile.dateOfBirth || null,
    headline: profile.headline,
    location: profile.location,
    bio: profile.summary,
    careerLevel: profile.professional.careerLevel || undefined,
    totalExperienceYears: profile.professional.totalExperienceYears,
    totalExperienceMonths: profile.professional.totalExperienceMonths,
    noticePeriodDays: profile.professional.noticePeriodDays,
    workAuthorization: profile.professional.workAuthorization || undefined,
    willingToRelocate: profile.professional.willingToRelocate || undefined,
    relocationLocations: profile.professional.relocationLocations,
    availability: profile.professional.availability || undefined,
    customNoticePeriodDays: profile.professional.customNoticePeriodDays,
    skills: profile.skills.map((skill) => ({
      skillName: skill.skillName,
      proficiency: skill.proficiency,
      yearsOfExperience: skill.yearsOfExperience,
    })),
    education: profile.education.filter((item) => item.degree.trim() && item.institution.trim()).map((item) => ({
      degree: item.degree,
      institution: item.institution,
      fieldOfStudy: item.fieldOfStudy || undefined,
      startYear: Number.parseInt(item.startDate, 10) || undefined,
      endYear: Number.parseInt(item.endDate, 10) || undefined,
      grade: item.grade || undefined,
      description: item.description || undefined,
    })),
    experience: profile.experience.filter((item) => item.title.trim() && item.company.trim()).map((item) => ({
      company: item.company,
      jobTitle: item.title,
      employmentType: item.employmentType.toUpperCase().replaceAll(' ', '_') || undefined,
      location: item.location || undefined,
      startDate: item.startDate ? item.startDate : undefined,
      endDate: item.currentlyWorking ? null : item.endDate || null,
      currentJob: item.currentlyWorking,
      description: item.description || undefined,
      skills: item.skills,
    })),
    projects: profile.projects.filter((item) => item.name.trim()).map((item) => {
      const link = item.projectUrl.trim()
      return {
        name: item.name,
        description: item.description || undefined,
        technologies: splitList(item.technologies),
        githubUrl: item.projectLinkType === 'github' ? link || undefined : item.githubUrl || undefined,
        demoUrl: item.projectLinkType !== 'github' ? link || undefined : item.demoUrl || undefined,
        imageUrl: item.imageUrl || undefined,
        startDate: item.startDate || undefined,
        endDate: item.endDate || undefined,
      }
    }),
    certifications: profile.certifications.filter((item) => item.name.trim() && item.organisation.trim()).map((item) => ({
      name: item.name,
      issuingOrganization: item.organisation,
      issueDate: item.issueDate || undefined,
      expiryDate: item.expiryDate || undefined,
      credentialId: item.credentialId || undefined,
      credentialUrl: item.credentialUrl || undefined,
    })),
    languages: profile.languages.filter((item) => item.language.trim()).map((item) => ({ language: item.language, proficiency: item.proficiency })),
    preferences: preferencePayload,
    parsedResumeData: makeParsedResumeData(profile, sourceParsedData),
    visibility: profile.visibility,
    allowRecruiterContact: profile.allowRecruiterContact,
    showInRecruiterSearch: profile.showInRecruiterSearch,
    showResumeToRecruiters: profile.showResumeToRecruiters,
    ...(completeOnboarding ? { completeOnboarding: true } : {}),
    ...(profile.openToWork !== originalOpenToWork
      ? { openToWork: profile.openToWork }
      : {}),
  }
}

export function CandidateProfilePage() {
  const { user, refreshSession } = useAuth()
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [initialProfile, setInitialProfile] = useState<CandidateProfile | null>(null)
  const [sourceParsedData, setSourceParsedData] = useState<ParsedResumeData | null>(null)
  const [resumeDraftPendingReview, setResumeDraftPendingReview] = useState(false)
  const [editingSection, setEditingSection] = useState<ProfileSectionKey | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPhotoSaving, setIsPhotoSaving] = useState(false)
  const [error, setError] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [notice, setNotice] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [languageInput, setLanguageInput] = useState('')
  const [languageLevel, setLanguageLevel] = useState<'BASIC' | 'CONVERSATIONAL' | 'PROFESSIONAL' | 'FLUENT' | 'NATIVE'>('PROFESSIONAL')
  const [roleInput, setRoleInput] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const photoInput = useRef<HTMLInputElement>(null)
  const accountName = user?.name || ''
  const email = user?.email || ''
  const isEditing = editingSection !== null
  const isSectionEditing = (section: ProfileSectionKey) => editingSection === 'all' || editingSection === section

  useEffect(() => {
    let active = true
    void candidateService.getProfile().then((response: CandidateProfileResponse) => {
      if (!active) return
      const parsed = response.profile.parsedResumeData ?? response.latestResume?.parsedData ?? null
      const mapped = mapCandidateProfile(response)
      setProfile(mapped)
      setInitialProfile(mapped)
      setSourceParsedData(parsed)
      setResumeDraftPendingReview(response.profile.resumeDraftPendingReview || (!response.onboardingComplete && Boolean(parsed)))
      setIsLoading(false)
    }).catch((loadError: unknown) => {
      if (!active) return
      setError(typeof loadError === 'object' && loadError !== null && 'response' in loadError
        ? (loadError as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'We could not load your profile. Please refresh and try again.'
        : 'We could not load your profile. Please refresh and try again.')
      setIsLoading(false)
    })
    return () => { active = false }
  }, [user?.id])

  const completion = profile?.profileCompletion
  const salaryRangeLabel = useMemo(() => {
    if (!profile) return ''
    return salaryRanges.find(({ min, max }) =>
      min === profile.preferences.expectedSalaryMin && max === profile.preferences.expectedSalaryMax)?.label ?? ''
  }, [profile])
  const availability = profile ? profile.professional.availability || availabilityFromNoticeDays(profile.professional.noticePeriodDays) : ''

  const updateProfile = (updater: (current: CandidateProfile) => CandidateProfile) => {
    setProfile((current) => current ? updater(current) : current)
  }

  const updateExperience = (id: string, updates: Partial<CandidateExperience>) => updateProfile((current) => ({
    ...current,
    experience: current.experience.map((item) => item.id === id ? { ...item, ...updates } : item),
  }))
  const updateEducation = (id: string, updates: Partial<CandidateEducation>) => updateProfile((current) => ({
    ...current,
    education: current.education.map((item) => item.id === id ? { ...item, ...updates } : item),
  }))
  const updateProject = (id: string, updates: Partial<CandidateProject>) => updateProfile((current) => ({
    ...current,
    projects: current.projects.map((item) => item.id === id ? { ...item, ...updates } : item),
  }))

  const startEditing = (section: ProfileSectionKey = 'all') => {
    setInitialProfile(profile)
    setEditingSection(section)
    setError('')
    setNotice('')
  }

  const cancelEditing = () => {
    if (initialProfile) setProfile(initialProfile)
    setEditingSection(null)
    setError('')
    setPhotoError('')
  }

  const saveProfile = async (section: ProfileSectionKey | null = editingSection) => {
    if (!profile) return
    setIsSaving(true)
    setError('')
    setNotice('')
    try {
      const fullPayload = profileUpdate(profile, sourceParsedData, resumeDraftPendingReview, initialProfile?.openToWork ?? profile.openToWork)
      const sectionPayload: Partial<Record<Exclude<ProfileSectionKey, 'all'>, CandidateProfileUpdate>> = {
        about: { headline: fullPayload.headline, bio: fullPayload.bio },
        contact: { fullName: fullPayload.fullName, phone: fullPayload.phone, gender: fullPayload.gender, dateOfBirth: fullPayload.dateOfBirth, location: fullPayload.location },
        career: {
          careerLevel: fullPayload.careerLevel,
          totalExperienceYears: fullPayload.totalExperienceYears,
          totalExperienceMonths: fullPayload.totalExperienceMonths,
          noticePeriodDays: fullPayload.noticePeriodDays,
          availability: fullPayload.availability,
          customNoticePeriodDays: fullPayload.customNoticePeriodDays,
          workAuthorization: fullPayload.workAuthorization,
          willingToRelocate: fullPayload.willingToRelocate,
          relocationLocations: fullPayload.relocationLocations,
        },
        skills: { skills: fullPayload.skills },
        education: { education: fullPayload.education },
        experience: { experience: fullPayload.experience },
        projects: { projects: fullPayload.projects },
        certifications: { certifications: fullPayload.certifications },
        languages: { languages: fullPayload.languages },
        links: { links: fullPayload.links },
        preferences: {
          preferences: fullPayload.preferences,
          openToWork: profile.openToWork,
          visibility: fullPayload.visibility,
          allowRecruiterContact: fullPayload.allowRecruiterContact,
          showInRecruiterSearch: fullPayload.showInRecruiterSearch,
          showResumeToRecruiters: fullPayload.showResumeToRecruiters,
        },
      }
      const payload = section && section !== 'all' && !resumeDraftPendingReview
        ? sectionPayload[section] ?? fullPayload
        : fullPayload
      const response = await candidateService.saveProfile(payload)
      const mapped = mapCandidateProfile(response)
      setProfile(mapped)
      setInitialProfile(mapped)
      setSourceParsedData(response.profile.parsedResumeData ?? response.latestResume?.parsedData ?? null)
      setResumeDraftPendingReview(false)
      setEditingSection(null)
      const refreshedUser = await refreshSession()
      setNotice(refreshedUser
        ? resumeDraftPendingReview ? 'Your resume-based profile has been confirmed and saved.' : 'Your profile changes have been saved.'
        : 'Your profile was saved, but your session could not be refreshed. Refresh the page to continue.')
    } catch (saveError) {
      setError(typeof saveError === 'object' && saveError !== null && 'response' in saveError
        ? (saveError as { response?: { data?: { message?: string | string[] } } }).response?.data?.message?.toString() ?? 'We could not save your profile. Please try again.'
        : saveError instanceof Error ? saveError.message : 'We could not save your profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const uploadPhoto = async (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setPhotoError('Choose a JPEG, PNG, or WebP image up to 5MB.')
      return
    }
    setPhotoError('')
    setIsPhotoSaving(true)
    try {
      await candidateService.uploadProfilePhoto(file)
      const response = await candidateService.getProfile()
      const mapped = mapCandidateProfile(response)
      setProfile(mapped)
      setInitialProfile(mapped)
    } catch {
      setPhotoError('Could not upload your profile photo. Please try again.')
    } finally {
      setIsPhotoSaving(false)
      if (photoInput.current) photoInput.current.value = ''
    }
  }

  const removePhoto = async () => {
    setPhotoError('')
    setIsPhotoSaving(true)
    try {
      await candidateService.removeProfilePhoto()
      const response = await candidateService.getProfile()
      const mapped = mapCandidateProfile(response)
      setProfile(mapped)
      setInitialProfile(mapped)
    } catch {
      setPhotoError('Could not remove your profile photo. Please try again.')
    } finally {
      setIsPhotoSaving(false)
    }
  }

  const addSkill = () => {
    const value = skillInput.trim()
    if (!value || profile?.skills.some((item) => item.skillName.toLowerCase() === value.toLowerCase())) return
    updateProfile((current) => ({ ...current, skills: [...current.skills, { skillName: value, proficiency: 'INTERMEDIATE', yearsOfExperience: null }] }))
    setSkillInput('')
  }
  const removeSkill = (skillName: string) => updateProfile((current) => ({
    ...current,
    skills: current.skills.filter((item) => item.skillName !== skillName),
  }))
  const togglePreference = (field: 'workModes' | 'employmentTypes', value: string) => updateProfile((current) => {
    const values = current.preferences[field]
    return { ...current, preferences: { ...current.preferences, [field]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] } }
  })
  const addRole = () => {
    const value = roleInput.trim()
    if (value && !profile?.preferences.desiredTitles.includes(value)) updateProfile((current) => ({ ...current, preferences: { ...current.preferences, desiredTitles: [...current.preferences.desiredTitles, value] } }))
    setRoleInput('')
  }
  const addLocation = () => {
    const value = locationInput.trim()
    if (value && !profile?.preferences.preferredLocations.includes(value)) updateProfile((current) => ({ ...current, preferences: { ...current.preferences, preferredLocations: [...current.preferences.preferredLocations, value] } }))
    setLocationInput('')
  }

  if (isLoading) return <p className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-600">Loading your profile...</p>
  if (!profile) return <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error || 'We could not load your profile.'}</div>

  const personName = profile.fullName || accountName || 'Candidate'
  const simpleField = (label: string, value: string, onChange: (value: string) => void, type = 'text') => (
    <label className="block space-y-1 text-xs font-medium text-slate-600">{label}
      <input className={inputClass} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
  const editButton = (section: ProfileSectionKey) => () => startEditing(section)

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-8">
      {resumeDraftPendingReview ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-base font-semibold text-slate-900">Review your profile</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">We extracted information from your resume. Review the details below, edit anything that needs correction, then confirm to save this profile. Your existing saved profile has not been overwritten by the upload.</p>
          {profile.resume.fileName ? <p className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-700"><FileText className="h-4 w-4" />{profile.resume.fileName}</p> : null}
          {!isEditing ? <div className="mt-3 flex flex-wrap gap-2"><Button type="button" className="h-9" variant="outline" onClick={() => startEditing('all')}>Review & edit profile</Button><Button type="button" className="h-9" disabled={isSaving} onClick={() => void saveProfile('all')}>{isSaving ? 'Saving…' : 'Confirm & Save Profile'}</Button></div> : null}
        </div>
      ) : null}

      {error ? <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
      {notice ? <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p> : null}

      <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-50 text-xl font-semibold text-orange-800">
            {profile.profilePhotoUrl ? <img crossOrigin="use-credentials" src={candidateService.getProfilePhotoUrl(profile.profilePhotoUrl)} alt={`${personName} profile`} className="h-full w-full object-cover" /> : personName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">{personName}</h1>
            <p className="mt-1 text-sm text-slate-600">{displayValue(profile.headline, 'Add a professional headline')}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600"><MapPin className="h-3.5 w-3.5 text-orange-700" />{displayValue(profile.location, 'Add your location')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void uploadPhoto(event.target.files?.[0])} />
            <Button variant="outline" size="sm" disabled={isPhotoSaving || isEditing} onClick={() => photoInput.current?.click()}><Camera className="mr-1.5 h-4 w-4" />{profile.profilePhotoUrl ? 'Replace photo' : 'Add photo'}</Button>
          </div>
        </div>
        {photoError ? <p role="alert" className="mt-3 text-xs text-red-700">{photoError}</p> : null}
        {profile.profilePhotoUrl ? <button type="button" onClick={() => void removePhoto()} disabled={isPhotoSaving} className="mt-2 text-xs font-medium text-slate-500 hover:text-red-700 disabled:opacity-50">Remove profile photo</button> : null}

        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-700">Profile strength</span><span className="font-semibold text-slate-900">{completion?.percentage ?? 0}%</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${completion?.percentage ?? 0}%` }} /></div>
          </div>
          </div>
        {completion?.sections.length ? (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3">
            {completion.sections.map((item) => <li key={item.label} className={`flex items-center gap-1.5 text-[11px] ${item.complete ? 'text-emerald-800' : 'text-slate-500'}`}><span aria-hidden="true">{item.complete ? '✓' : '○'}</span>{item.label}</li>)}
          </ul>
        ) : null}
      </header>


      <EditableSection title="About" editing={isSectionEditing('about')} onEdit={editButton('about')} onSave={() => void saveProfile('about')} onCancel={cancelEditing} saving={isSaving} showActions={editingSection !== 'all'}>
        {isSectionEditing('about') ? <div className="space-y-3">
          {simpleField('Professional headline', profile.headline, (value) => updateProfile((current) => ({ ...current, headline: value })))}
          <label className="block space-y-1 text-xs font-medium text-slate-600">About<textarea className={textareaClass} value={profile.summary} onChange={(event) => updateProfile((current) => ({ ...current, summary: event.target.value }))} placeholder="Write a concise summary about your experience and goals." /></label>
        </div> : <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{displayValue(profile.summary, 'Add a short professional summary.')}</p>}
      </EditableSection>

      <EditableSection title="Contact information" editing={isSectionEditing('contact')} onEdit={editButton('contact')} onSave={() => void saveProfile('contact')} onCancel={cancelEditing} saving={isSaving} showActions={editingSection !== 'all'}>
        {isSectionEditing('contact') ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {simpleField('Full name', profile.fullName, (value) => updateProfile((current) => ({ ...current, fullName: value })))}
            <label className="block space-y-1 text-xs font-medium text-slate-600">Account email<input className={`${inputClass} bg-slate-100 text-slate-500`} value={email} readOnly /></label>
            {simpleField('Phone', profile.phone, (value) => updateProfile((current) => ({ ...current, phone: value })), 'tel')}
            <label className="block space-y-1 text-xs font-medium text-slate-600">Current location<input className={inputClass} list="profile-location-options" value={profile.location} onChange={(event) => updateProfile((current) => ({ ...current, location: event.target.value }))} /><datalist id="profile-location-options">{locationOptions.map((item) => <option key={item}>{item}</option>)}</datalist></label>
            {simpleField('Date of birth', profile.dateOfBirth, (value) => updateProfile((current) => ({ ...current, dateOfBirth: value })), 'date')}
            <label className="block space-y-1 text-xs font-medium text-slate-600">Gender
              <select className={inputClass} value={profile.gender} onChange={(event) => updateProfile((current) => ({ ...current, gender: event.target.value }))}>
                <option value="">Prefer not to say</option><option value="WOMAN">Woman</option><option value="MAN">Man</option><option value="NON_BINARY">Non-binary</option><option value="SELF_DESCRIBED">Self-described</option><option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </label>
          </div>
        ) : <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {[['Full name', profile.fullName], ['Email', email], ['Phone', profile.phone], ['Current location', profile.location], ['Date of birth', profile.dateOfBirth], ['Gender', profile.gender.replaceAll('_', ' ').toLowerCase()]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 font-medium text-slate-800">{displayValue(value)}</dd></div>)}
        </dl>}
      </EditableSection>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="eyebrow">At a glance</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">Career snapshot</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-xs text-slate-500">Experience</dt><dd className="mt-1 text-sm font-medium text-slate-900">{profile.professional.totalExperienceYears == null ? displayValue(null) : `${profile.professional.totalExperienceYears} years${profile.professional.totalExperienceMonths ? ` ${profile.professional.totalExperienceMonths} months` : ''}`}</dd></div>
          <div><dt className="text-xs text-slate-500">Preferred roles</dt><dd className="mt-1 text-sm font-medium text-slate-900">{displayValue(profile.preferences.desiredTitles.join(', '))}</dd></div>
          <div><dt className="text-xs text-slate-500">Work mode</dt><dd className="mt-1 text-sm font-medium text-slate-900">{displayValue(profile.preferences.workModes.map((item) => item === 'ONSITE' ? 'On-site' : item.toLowerCase()).join(', '))}</dd></div>
          <div><dt className="text-xs text-slate-500">Location</dt><dd className="mt-1 text-sm font-medium text-slate-900">{displayValue(profile.location)}</dd></div>
          <div><dt className="text-xs text-slate-500">Salary range</dt><dd className="mt-1 text-sm font-medium text-slate-900">{displayValue(salaryRangeLabel)}</dd></div>
          <div><dt className="text-xs text-slate-500">Open to work</dt><dd className="mt-1 text-sm font-medium text-slate-900">{profile.openToWork === 'NOT_LOOKING' ? 'Not looking' : profile.openToWork === 'ACTIVELY_LOOKING' ? 'Actively looking' : 'Open to opportunities'}</dd></div>
        </dl>
      </section>

      <EditableSection title="Career details" editing={isSectionEditing('career')} onEdit={editButton('career')} onSave={() => void saveProfile('career')} onCancel={cancelEditing} saving={isSaving} showActions={editingSection !== 'all'}>
        {isSectionEditing('career') ? <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-xs font-medium text-slate-600">Career level<select className={inputClass} value={profile.professional.careerLevel} onChange={(event) => updateProfile((current) => ({ ...current, professional: { ...current.professional, careerLevel: event.target.value } }))}><option value="">Select</option>{[['STUDENT', 'Student'], ['FRESHER', 'Fresher'], ['ENTRY_LEVEL', 'Entry level'], ['MID_LEVEL', 'Mid level'], ['SENIOR', 'Senior'], ['LEAD', 'Lead'], ['MANAGER', 'Manager']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="block space-y-1 text-xs font-medium text-slate-600">Total experience<select className={inputClass} value={profile.professional.totalExperienceYears ?? ''} onChange={(event) => updateProfile((current) => ({ ...current, professional: { ...current.professional, totalExperienceYears: event.target.value ? Number(event.target.value) : null } }))}><option value="">Not specified</option>{Array.from({ length: 31 }, (_, index) => <option key={index} value={index}>{index === 0 ? 'Fresher' : `${index} years`}</option>)}</select></label>
          <label className="block space-y-1 text-xs font-medium text-slate-600">Availability<select className={inputClass} value={availability} onChange={(event) => {
            const selected = availabilityOptions.find(([value]) => value === event.target.value)
            updateProfile((current) => ({ ...current, professional: { ...current.professional, availability: event.target.value, noticePeriodDays: selected?.[2] ?? current.professional.noticePeriodDays } }))
          }}><option value="">Select</option>{availabilityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          {availability === 'CUSTOM' ? <label className="block space-y-1 text-xs font-medium text-slate-600">Custom notice (days)<input className={inputClass} type="number" min="0" max="365" value={profile.professional.customNoticePeriodDays ?? ''} onChange={(event) => updateProfile((current) => {
            const days = event.target.value ? Number(event.target.value) : null
            return { ...current, professional: { ...current.professional, customNoticePeriodDays: days, noticePeriodDays: days } }
          })} /></label> : null}
          <label className="block space-y-1 text-xs font-medium text-slate-600">Work authorization<select className={inputClass} value={profile.professional.workAuthorization} onChange={(event) => updateProfile((current) => ({ ...current, professional: { ...current.professional, workAuthorization: event.target.value } }))}><option value="">Select</option>{['CITIZEN', 'PERMANENT_RESIDENT', 'WORK_VISA', 'REQUIRES_SPONSORSHIP', 'OTHER'].map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}</select></label>
          <label className="block space-y-1 text-xs font-medium text-slate-600">Willing to relocate<select className={inputClass} value={profile.professional.willingToRelocate} onChange={(event) => updateProfile((current) => ({ ...current, professional: { ...current.professional, willingToRelocate: event.target.value } }))}><option value="">Select</option><option value="YES">Yes</option><option value="NO">No</option><option value="MAYBE">Maybe</option></select></label>
          <label className="block space-y-1 text-xs font-medium text-slate-600 sm:col-span-2">Preferred relocation locations<input className={inputClass} list="relocation-location-options" value={profile.professional.relocationLocations.join(', ')} onChange={(event) => updateProfile((current) => ({ ...current, professional: { ...current.professional, relocationLocations: splitList(event.target.value) } }))} /><datalist id="relocation-location-options">{locationOptions.map((item) => <option key={item}>{item}</option>)}</datalist></label>
        </div> : <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <p><span className="text-xs text-slate-500">Career level</span><br /><strong>{displayValue(profile.professional.careerLevel.replaceAll('_', ' '))}</strong></p>
          <p><span className="text-xs text-slate-500">Availability</span><br /><strong>{displayValue(availability.replaceAll('_', ' ').toLowerCase())}</strong></p>
          <p><span className="text-xs text-slate-500">Work authorization</span><br /><strong>{displayValue(profile.professional.workAuthorization.replaceAll('_', ' ').toLowerCase())}</strong></p>
          <p><span className="text-xs text-slate-500">Relocation</span><br /><strong>{displayValue(profile.professional.willingToRelocate)}</strong></p>
          {profile.professional.relocationLocations.length ? <p className="basis-full"><span className="text-xs text-slate-500">Preferred relocation locations</span><br /><strong>{profile.professional.relocationLocations.join(', ')}</strong></p> : null}
        </div>}
      </EditableSection>

      <EditableSection title="Skills" editing={isSectionEditing('skills')} onEdit={editButton('skills')} onSave={() => void saveProfile('skills')} onCancel={cancelEditing} saving={isSaving} showActions={editingSection !== 'all'}>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill) => <span key={skill.id ?? skill.skillName} className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-950">{skill.skillName}{isSectionEditing('skills') ? <button type="button" onClick={() => removeSkill(skill.skillName)} aria-label={`Remove ${skill.skillName}`}><X className="h-3.5 w-3.5" /></button> : null}</span>)}
          {!profile.skills.length ? <p className="text-sm text-slate-500">No skills added yet.</p> : null}
        </div>
        {isSectionEditing('skills') ? <div className="mt-3 flex gap-2"><input className={inputClass} list="skill-suggestions" value={skillInput} onChange={(event) => setSkillInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addSkill() } }} placeholder="Search and add a skill" /><datalist id="skill-suggestions">{['Python', 'SQL', 'Machine Learning', 'AWS', 'React', 'TypeScript', 'NestJS', 'Data Analysis', 'Communication'].map((item) => <option key={item}>{item}</option>)}</datalist><Button type="button" variant="outline" onClick={addSkill}><Plus className="mr-1 h-4 w-4" />Add</Button></div> : null}
      </EditableSection>

      <EditableSection title="Education" editing={isSectionEditing('education')} onEdit={editButton('education')} onSave={() => void saveProfile('education')} onCancel={cancelEditing} saving={isSaving} showActions={editingSection !== 'all'}>
        <div className="space-y-3">
          {profile.education.map((item) => <article key={item.id} className="rounded-lg border border-slate-200 p-3">
            {isSectionEditing('education') ? <div className="grid gap-2 sm:grid-cols-2">
              <input className={inputClass} aria-label="Degree" value={item.degree} onChange={(event) => updateEducation(item.id, { degree: event.target.value })} placeholder="Qualification and course" />
              <input className={inputClass} aria-label="Institution" value={item.institution} onChange={(event) => updateEducation(item.id, { institution: event.target.value })} placeholder="College / university" />
              <input className={inputClass} aria-label="Field of study" value={item.fieldOfStudy} onChange={(event) => updateEducation(item.id, { fieldOfStudy: event.target.value })} placeholder="Specialization" />
              <div className="grid grid-cols-2 gap-2"><input className={inputClass} aria-label="Start year" type="number" min="1900" max="2200" value={item.startDate} onChange={(event) => updateEducation(item.id, { startDate: event.target.value })} placeholder="Start year" /><input className={inputClass} aria-label="Graduation year" type="number" min="1900" max="2200" value={item.endDate} onChange={(event) => updateEducation(item.id, { endDate: event.target.value })} placeholder="Graduation year" /></div>
              <input className={inputClass} aria-label="Grade" value={item.grade} onChange={(event) => updateEducation(item.id, { grade: event.target.value })} placeholder="Grade / CGPA" />
              <button type="button" onClick={() => updateProfile((current) => ({ ...current, education: current.education.filter((record) => record.id !== item.id) }))} className="justify-self-end text-xs font-medium text-red-700">Delete education</button>
            </div> : <><h3 className="text-sm font-semibold text-slate-900">{displayValue(item.degree)}</h3><p className="mt-1 text-sm text-slate-700">{displayValue(item.institution)}</p><p className="mt-1 text-xs text-slate-500">{[item.fieldOfStudy, item.startDate, item.endDate].filter(Boolean).join(' · ')}{item.grade ? ` · ${item.grade}` : ''}</p>{item.description ? <p className="mt-2 text-xs leading-5 text-slate-600">{item.description}</p> : null}</>}
          </article>)}
          {!profile.education.length && !isSectionEditing('education') ? <p className="text-sm text-slate-500">No education added yet.</p> : null}
        </div>
        {isSectionEditing('education') ? <Button type="button" className="mt-3" variant="outline" size="sm" onClick={() => updateProfile((current) => ({ ...current, education: [...current.education, { id: `education-${Date.now()}`, institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', grade: '', description: '' }] }))}><Plus className="mr-1 h-4 w-4" />Add education</Button> : null}
      </EditableSection>

      <EditableSection title="Experience" editing={isSectionEditing('experience')} onEdit={editButton('experience')} onSave={() => void saveProfile('experience')} onCancel={cancelEditing} saving={isSaving} showActions={editingSection !== 'all'}>
        <div className="space-y-3">
          {profile.experience.map((item) => <article key={item.id} className="rounded-lg border border-slate-200 p-3">
            {isSectionEditing('experience') ? <div className="grid gap-2 sm:grid-cols-2">
              <input className={inputClass} aria-label="Job title" value={item.title} onChange={(event) => updateExperience(item.id, { title: event.target.value })} placeholder="Job title" />
              <input className={inputClass} aria-label="Company" value={item.company} onChange={(event) => updateExperience(item.id, { company: event.target.value })} placeholder="Company" />
              <select className={inputClass} aria-label="Employment type" value={item.employmentType} onChange={(event) => updateExperience(item.id, { employmentType: event.target.value })}><option value="">Employment type</option>{experienceTypes.map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select>
              <input className={inputClass} aria-label="Location" value={item.location} onChange={(event) => updateExperience(item.id, { location: event.target.value })} placeholder="Location" />
              <input className={inputClass} aria-label="Start date" type="date" value={item.startDate} onChange={(event) => updateExperience(item.id, { startDate: event.target.value })} />
              <label className="flex h-10 items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={item.currentlyWorking} onChange={(event) => updateExperience(item.id, { currentlyWorking: event.target.checked, endDate: event.target.checked ? '' : item.endDate })} />Currently working</label>
              {!item.currentlyWorking ? <input className={inputClass} aria-label="End date" type="date" value={item.endDate} onChange={(event) => updateExperience(item.id, { endDate: event.target.value })} /> : null}
              <input className={inputClass} aria-label="Skills used" value={item.skills.join(', ')} onChange={(event) => updateExperience(item.id, { skills: splitList(event.target.value) })} placeholder="Skills used, comma-separated" />
              <textarea className={`${textareaClass} sm:col-span-2`} aria-label="Description" value={item.description} onChange={(event) => updateExperience(item.id, { description: event.target.value })} placeholder="Responsibilities and achievements" />
              <button type="button" onClick={() => updateProfile((current) => ({ ...current, experience: current.experience.filter((record) => record.id !== item.id) }))} className="justify-self-end text-xs font-medium text-red-700">Delete experience</button>
            </div> : <><h3 className="text-sm font-semibold text-slate-900">{displayValue(item.title)}</h3><p className="mt-1 text-sm text-slate-700">{displayValue(item.company)}{item.location ? ` · ${item.location}` : ''}</p><p className="mt-1 text-xs text-slate-500">{[item.employmentType.replaceAll('_', ' ').toLowerCase(), formatDate(item.startDate), item.currentlyWorking ? 'Present' : formatDate(item.endDate)].filter(Boolean).join(' · ')}</p>{item.description ? <p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-600">{item.description}</p> : null}{item.skills.length ? <p className="mt-2 text-xs text-slate-600">Skills: {item.skills.join(', ')}</p> : null}</>}
          </article>)}
          {!profile.experience.length && !isSectionEditing('experience') ? <p className="text-sm text-slate-500">No experience added yet.</p> : null}
        </div>
        {isSectionEditing('experience') ? <Button type="button" className="mt-3" variant="outline" size="sm" onClick={() => updateProfile((current) => ({ ...current, experience: [...current.experience, { id: `experience-${Date.now()}`, title: '', company: '', employmentType: '', location: '', startDate: '', endDate: '', currentlyWorking: false, description: '', skills: [] }] }))}><Plus className="mr-1 h-4 w-4" />Add experience</Button> : null}
      </EditableSection>

      <EditableSection title="Projects" editing={isSectionEditing('projects')} onEdit={editButton('projects')} onSave={() => void saveProfile('projects')} onCancel={cancelEditing} saving={isSaving} showActions={editingSection !== 'all'}>
        <div className="space-y-3">
          {profile.projects.map((item) => <article key={item.id} className="rounded-lg border border-slate-200 p-3">
            {isSectionEditing('projects') ? <div className="grid gap-2 sm:grid-cols-2">
              <input className={inputClass} aria-label="Project name" value={item.name} onChange={(event) => updateProject(item.id, { name: event.target.value })} placeholder="Project name" />
              <input className={inputClass} aria-label="Technologies" value={item.technologies} onChange={(event) => updateProject(item.id, { technologies: event.target.value })} placeholder="Technologies, comma-separated" />
              <input className={`${inputClass} sm:col-span-2`} aria-label="Project link" type="url" value={item.projectUrl} onChange={(event) => updateProject(item.id, { projectUrl: event.target.value })} placeholder="One optional project link (https://...)" />
              <input className={inputClass} aria-label="Start date" type="date" value={item.startDate} onChange={(event) => updateProject(item.id, { startDate: event.target.value })} />
              <input className={inputClass} aria-label="End date" type="date" value={item.endDate} onChange={(event) => updateProject(item.id, { endDate: event.target.value })} />
              <textarea className={`${textareaClass} sm:col-span-2`} aria-label="Project description" value={item.description} onChange={(event) => updateProject(item.id, { description: event.target.value })} placeholder="Project description" />
              <button type="button" onClick={() => updateProfile((current) => ({ ...current, projects: current.projects.filter((record) => record.id !== item.id) }))} className="justify-self-end text-xs font-medium text-red-700">Delete project</button>
            </div> : <><h3 className="text-sm font-semibold text-slate-900">{displayValue(item.name)}</h3>{item.description ? <p className="mt-1 whitespace-pre-line text-sm leading-5 text-slate-700">{item.description}</p> : null}{item.technologies ? <p className="mt-2 text-xs text-slate-600">{item.technologies}</p> : null}{item.startDate || item.endDate ? <p className="mt-1 text-xs text-slate-500">{[formatDate(item.startDate), formatDate(item.endDate)].filter(Boolean).join(' — ')}</p> : null}{item.projectUrl ? <a className="mt-2 inline-block text-xs font-semibold text-orange-800 hover:underline" href={item.projectUrl} target="_blank" rel="noreferrer">Open project link ↗</a> : null}</>}
          </article>)}
          {!profile.projects.length && !isSectionEditing('projects') ? <p className="text-sm text-slate-500">No projects added yet.</p> : null}
        </div>
        {isSectionEditing('projects') ? <Button type="button" className="mt-3" variant="outline" size="sm" onClick={() => updateProfile((current) => ({ ...current, projects: [...current.projects, { id: `project-${Date.now()}`, name: '', description: '', technologies: '', projectUrl: '', projectLinkType: 'demo', githubUrl: '', demoUrl: '', imageUrl: '', startDate: '', endDate: '' }] }))}><Plus className="mr-1 h-4 w-4" />Add project</Button> : null}
      </EditableSection>

      <EditableSection title="Certifications" editing={isSectionEditing('certifications')} onEdit={editButton('certifications')} onSave={() => void saveProfile('certifications')} onCancel={cancelEditing} saving={isSaving} showActions={editingSection !== 'all'}>
        <div className="space-y-3">{profile.certifications.map((item) => <article key={item.id} className="rounded-lg border border-slate-200 p-3">
          {isSectionEditing('certifications') ? <div className="grid gap-2 sm:grid-cols-2">
            <input className={inputClass} aria-label="Certification name" value={item.name} onChange={(event) => updateProfile((current) => ({ ...current, certifications: current.certifications.map((record) => record.id === item.id ? { ...record, name: event.target.value } : record) }))} placeholder="Certification name" />
            <input className={inputClass} aria-label="Issuing organization" value={item.organisation} onChange={(event) => updateProfile((current) => ({ ...current, certifications: current.certifications.map((record) => record.id === item.id ? { ...record, organisation: event.target.value } : record) }))} placeholder="Issuing organization" />
            <input className={inputClass} aria-label="Issue date" type="date" value={item.issueDate} onChange={(event) => updateProfile((current) => ({ ...current, certifications: current.certifications.map((record) => record.id === item.id ? { ...record, issueDate: event.target.value } : record) }))} />
            <input className={inputClass} aria-label="Expiry date" type="date" value={item.expiryDate} onChange={(event) => updateProfile((current) => ({ ...current, certifications: current.certifications.map((record) => record.id === item.id ? { ...record, expiryDate: event.target.value } : record) }))} />
            <input className={inputClass} aria-label="Credential ID" value={item.credentialId} onChange={(event) => updateProfile((current) => ({ ...current, certifications: current.certifications.map((record) => record.id === item.id ? { ...record, credentialId: event.target.value } : record) }))} placeholder="Credential ID" />
            <input className={inputClass} aria-label="Credential URL" type="url" value={item.credentialUrl} onChange={(event) => updateProfile((current) => ({ ...current, certifications: current.certifications.map((record) => record.id === item.id ? { ...record, credentialUrl: event.target.value } : record) }))} placeholder="Credential URL" />
            <button type="button" onClick={() => updateProfile((current) => ({ ...current, certifications: current.certifications.filter((record) => record.id !== item.id) }))} className="justify-self-end text-xs font-medium text-red-700">Delete certification</button>
          </div> : <><h3 className="text-sm font-semibold text-slate-900">{item.name}</h3><p className="mt-1 text-sm text-slate-700">{item.organisation}</p><p className="mt-1 text-xs text-slate-500">{formatDate(item.issueDate)}{item.credentialId ? ` · ${item.credentialId}` : ''}</p>{item.credentialUrl ? <a className="mt-1 inline-block text-xs font-semibold text-orange-800 hover:underline" href={item.credentialUrl} target="_blank" rel="noreferrer">View credential ↗</a> : null}</>}
        </article>)}{!profile.certifications.length && !isSectionEditing('certifications') ? <p className="text-sm text-slate-500">No certifications added yet.</p> : null}</div>
        {isSectionEditing('certifications') ? <Button type="button" className="mt-3" variant="outline" size="sm" onClick={() => updateProfile((current) => ({ ...current, certifications: [...current.certifications, { id: `certification-${Date.now()}`, name: '', organisation: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '' }] }))}><Plus className="mr-1 h-4 w-4" />Add certification</Button> : null}
      </EditableSection>

      <EditableSection title="Languages" editing={isSectionEditing('languages')} onEdit={editButton('languages')} onSave={() => void saveProfile('languages')} onCancel={cancelEditing} saving={isSaving} showActions={editingSection !== 'all'}>
        <div className="flex flex-wrap gap-2">        {profile.languages.map((item) => <span key={item.id ?? item.language} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-800">{item.language} · {item.proficiency.toLowerCase()}{isSectionEditing('languages') ? <button type="button" onClick={() => updateProfile((current) => ({ ...current, languages: current.languages.filter((language) => language.language !== item.language) }))} aria-label={`Remove ${item.language}`}><X className="h-3.5 w-3.5" /></button> : null}</span>)}{!profile.languages.length ? <p className="text-sm text-slate-500">No languages added yet.</p> : null}</div>
        {isSectionEditing('languages') ? <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input className={inputClass} value={languageInput} onChange={(event) => setLanguageInput(event.target.value)} placeholder="Language" />
          <select className={inputClass} value={languageLevel} onChange={(event) => setLanguageLevel(event.target.value as typeof languageLevel)}>{languageLevels.map((level) => <option key={level} value={level}>{level.toLowerCase()}</option>)}</select>
          <Button variant="outline" onClick={() => {
            const language = languageInput.trim()
            if (!language || profile.languages.some((item) => item.language.toLowerCase() === language.toLowerCase())) return
            updateProfile((current) => ({ ...current, languages: [...current.languages, { language, proficiency: languageLevel }] }))
            setLanguageInput('')
          }}><Plus className="mr-1 h-4 w-4" />Add</Button>
        </div> : null}
      </EditableSection>

      <EditableSection title="Job preferences" editing={isSectionEditing('preferences')} onEdit={editButton('preferences')} onSave={() => void saveProfile('preferences')} onCancel={cancelEditing} saving={isSaving} showActions={editingSection !== 'all'}>
        {isSectionEditing('preferences') ? <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-600">Preferred job roles</p>
            <div className="mt-1.5 flex gap-2"><input className={inputClass} list="profile-role-options" value={roleInput} onChange={(event) => setRoleInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addRole() } }} placeholder="Search or add a role" /><datalist id="profile-role-options">{roleOptions.map((item) => <option key={item}>{item}</option>)}</datalist><Button variant="outline" onClick={addRole}>Add</Button></div>
            <div className="mt-2 flex flex-wrap gap-2">{profile.preferences.desiredTitles.map((item) => <button type="button" key={item} onClick={() => updateProfile((current) => ({ ...current, preferences: { ...current.preferences, desiredTitles: current.preferences.desiredTitles.filter((role) => role !== item) } }))} className="rounded-full bg-orange-50 px-3 py-1.5 text-xs text-orange-950">{item} ×</button>)}</div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600">Preferred locations</p>
            <div className="mt-1.5 flex gap-2"><input className={inputClass} list="profile-location-list" value={locationInput} onChange={(event) => setLocationInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addLocation() } }} placeholder="Search or add a location" /><datalist id="profile-location-list">{locationOptions.map((item) => <option key={item}>{item}</option>)}</datalist><Button variant="outline" onClick={addLocation}>Add</Button></div>
            <div className="mt-2 flex flex-wrap gap-2">{profile.preferences.preferredLocations.map((item) => <button type="button" key={item} onClick={() => updateProfile((current) => ({ ...current, preferences: { ...current.preferences, preferredLocations: current.preferences.preferredLocations.filter((place) => place !== item) } }))} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-800">{item} ×</button>)}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset><legend className="text-xs font-medium text-slate-600">Work mode</legend><div className="mt-2 flex flex-wrap gap-2">{workModes.map(([value, label]) => <label key={value} className={`cursor-pointer rounded-full border px-3 py-2 text-xs ${profile.preferences.workModes.includes(value) ? 'border-orange-400 bg-orange-50' : 'border-slate-200'}`}><input className="sr-only" type="checkbox" checked={profile.preferences.workModes.includes(value)} onChange={() => togglePreference('workModes', value)} />{label}</label>)}</div></fieldset>
            <fieldset><legend className="text-xs font-medium text-slate-600">Employment type</legend><div className="mt-2 flex flex-wrap gap-2">{employmentTypes.map(([value, label]) => <label key={value} className={`cursor-pointer rounded-full border px-3 py-2 text-xs ${profile.preferences.employmentTypes.includes(value) ? 'border-orange-400 bg-orange-50' : 'border-slate-200'}`}><input className="sr-only" type="checkbox" checked={profile.preferences.employmentTypes.includes(value)} onChange={() => togglePreference('employmentTypes', value)} />{label}</label>)}</div></fieldset>
            <label className="block space-y-1 text-xs font-medium text-slate-600">Expected salary range<select className={inputClass} value={salaryRangeLabel} onChange={(event) => {
              const range = salaryRanges.find((item) => item.label === event.target.value)
              updateProfile((current) => ({ ...current, preferences: { ...current.preferences, expectedSalaryMin: range?.min ?? null, expectedSalaryMax: range?.max ?? null } }))
            }}><option value="">Not specified</option>{salaryRanges.map((item) => <option key={item.label}>{item.label}</option>)}</select></label>
            <label className="block space-y-1 text-xs font-medium text-slate-600">Open to work<select className={inputClass} value={profile.openToWork} onChange={(event) => updateProfile((current) => ({ ...current, openToWork: event.target.value as CandidateProfile['openToWork'] }))}><option value="ACTIVELY_LOOKING">Actively looking</option><option value="OPEN_TO_OPPORTUNITIES">Open to opportunities</option><option value="NOT_LOOKING">Not looking</option></select></label>
            <label className="block space-y-1 text-xs font-medium text-slate-600">Profile visibility<select className={inputClass} value={profile.visibility} onChange={(event) => updateProfile((current) => ({ ...current, visibility: event.target.value as CandidateProfile['visibility'] }))}><option value="PUBLIC">Public</option><option value="RECRUITERS_ONLY">Recruiters only</option><option value="PRIVATE">Private</option></select></label>
            <fieldset className="space-y-2"><legend className="text-xs font-medium text-slate-600">Recruiter permissions</legend>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={profile.allowRecruiterContact} onChange={(event) => updateProfile((current) => ({ ...current, allowRecruiterContact: event.target.checked }))} />Allow recruiter contact</label>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={profile.showInRecruiterSearch} onChange={(event) => updateProfile((current) => ({ ...current, showInRecruiterSearch: event.target.checked }))} />Show my profile in recruiter search</label>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={profile.showResumeToRecruiters} onChange={(event) => updateProfile((current) => ({ ...current, showResumeToRecruiters: event.target.checked }))} />Share my resume with recruiters</label>
            </fieldset>
          </div>
        </div> : <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div><p className="text-xs text-slate-500">Preferred roles</p><p className="mt-1 font-medium text-slate-800">{displayValue(profile.preferences.desiredTitles.join(', '))}</p></div>
          <div><p className="text-xs text-slate-500">Preferred locations</p><p className="mt-1 font-medium text-slate-800">{displayValue(profile.preferences.preferredLocations.join(', '))}</p></div>
          <div><p className="text-xs text-slate-500">Work mode</p><p className="mt-1 font-medium text-slate-800">{displayValue(profile.preferences.workModes.map((item) => item === 'ONSITE' ? 'On-site' : item.toLowerCase()).join(', '))}</p></div>
          <div><p className="text-xs text-slate-500">Employment type</p><p className="mt-1 font-medium text-slate-800">{displayValue(profile.preferences.employmentTypes.map((item) => item.toLowerCase().replaceAll('_', '-')).join(', '))}</p></div>
          <div><p className="text-xs text-slate-500">Expected salary</p><p className="mt-1 font-medium text-slate-800">{displayValue(salaryRangeLabel)}</p></div>
          <div><p className="text-xs text-slate-500">Open to work</p><p className="mt-1 font-medium text-slate-800">{profile.openToWork === 'NOT_LOOKING' ? 'Not looking' : profile.openToWork === 'ACTIVELY_LOOKING' ? 'Actively looking' : 'Open to opportunities'}</p></div>
          <div><p className="text-xs text-slate-500">Profile visibility</p><p className="mt-1 font-medium text-slate-800">{profile.visibility.replaceAll('_', ' ').toLowerCase()}</p></div>
        </div>}
      </EditableSection>

      <EditableSection title="Links" editing={isSectionEditing('links')} onEdit={editButton('links')} onSave={() => void saveProfile('links')} onCancel={cancelEditing} saving={isSaving} showActions={editingSection !== 'all'}>
        {isSectionEditing('links') ? <div className="grid gap-3 sm:grid-cols-2">
          {simpleField('LinkedIn', profile.linkedin, (value) => updateProfile((current) => ({ ...current, linkedin: value })), 'url')}
          {simpleField('GitHub', profile.github, (value) => updateProfile((current) => ({ ...current, github: value })), 'url')}
          {simpleField('Portfolio', profile.portfolio, (value) => updateProfile((current) => ({ ...current, portfolio: value })), 'url')}
        </div> : profile.links.length ? <ul className="flex flex-wrap gap-2">{profile.links.map((item) => <li key={item.id ?? `${item.type}-${item.url}`}><a href={item.url} target="_blank" rel="noreferrer" className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-orange-800 hover:bg-orange-50">{item.label || item.type.replaceAll('_', ' ')} ↗</a></li>)}</ul> : <p className="text-sm text-slate-500">No links added yet.</p>}
      </EditableSection>

      <ProfileSection title="Resume">
        {profile.resume.fileName ? <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"><FileText className="h-5 w-5 shrink-0 text-orange-700" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{profile.resume.fileName}</p><p className="mt-0.5 text-xs text-slate-500">{profile.resume.fileType} {profile.resume.fileSize ? `· ${profile.resume.fileSize}` : ''} · Parsed</p></div></div><a className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href={candidateService.getResumeUrl()} target="_blank" rel="noreferrer">View resume</a><Link className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-700" to="/candidate/resume">Replace resume</Link>
        </div> : <p className="text-sm text-slate-500">No resume uploaded yet. <Link className="font-semibold text-orange-800 hover:underline" to="/candidate/resume">Upload a resume</Link>.</p>}
      </ProfileSection>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <StandOutSection />
      </div>

      {editingSection === 'all' ? <div className="sticky bottom-3 z-10 flex flex-col-reverse gap-2 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={isSaving} onClick={cancelEditing}>Cancel</Button>
        <Button type="button" disabled={isSaving} onClick={() => void saveProfile('all')}>{isSaving ? 'Saving…' : resumeDraftPendingReview ? 'Confirm & Save Profile' : 'Save Profile'}</Button>
      </div> : null}
    </div>
  )
}
