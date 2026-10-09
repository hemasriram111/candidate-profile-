import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, LoaderCircle, UploadCloud, X } from 'lucide-react'
import logoImage from '../../assets/logo.png'
import { StandOutSection } from '../../components/candidate/StandOutSection'
import { useAuth } from '../../components/common/AuthContext'
import { candidateService, type CandidateProfileResponse } from '../../services/candidateService'
import { mapCandidateProfile } from '../../utils/candidateProfileMapper'

const MAX_FILE_SIZE = 8 * 1024 * 1024
const acceptedExtensions = ['pdf', 'doc', 'docx']
const acceptedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const locationOptions = [
  'Hyderabad', 'Bengaluru', 'Chennai', 'Pune', 'Mumbai', 'Delhi NCR',
  'Gurugram', 'Noida', 'Kolkata', 'Ahmedabad', 'Remote',
]
const roleOptions = [
  'Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
  'Python Developer', 'AI Engineer', 'ML Engineer', 'Data Scientist', 'Gen AI Developer',
  'DevOps Engineer', 'Data Analyst', 'QA Engineer',
]
const salaryRanges = [
  { label: '₹0–3 LPA', min: 0, max: 300_000 },
  { label: '₹3–5 LPA', min: 300_000, max: 500_000 },
  { label: '₹5–8 LPA', min: 500_000, max: 800_000 },
  { label: '₹8–12 LPA', min: 800_000, max: 1_200_000 },
  { label: '₹12–20 LPA', min: 1_200_000, max: 2_000_000 },
  { label: '₹20+ LPA', min: 2_000_000, max: null },
]
const inputClass = 'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
const selectClass = `${inputClass} cursor-pointer`

type EducationDraft = {
  id: string
  qualification: string
  course: string
  specialization: string
  institution: string
  graduationYear: string
  status: 'COMPLETED' | 'PURSUING'
  grade: string
}

function getUploadError(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: { message?: string | string[] } } }).response
    if (response?.status === 413) return 'Your resume is larger than 8MB.'
    if (Array.isArray(response?.data?.message)) return response.data.message.join(' ')
    if (response?.data?.message) return response.data.message
  }
  return error instanceof Error ? error.message : 'Resume upload failed. Please try again.'
}

function mapEducation(response: CandidateProfileResponse): EducationDraft[] {
  const knownQualifications = ['10th', '12th', 'Diploma', "Bachelor's Degree", "Master's Degree", 'M.Tech', 'MCA', 'MBA', 'PhD', 'Other']
  const entries: EducationDraft[] = response.profile.education.map((item) => {
    const [qualification, ...courseParts] = item.degree.split(' — ')
    const matchedQualification = knownQualifications.find((value) => value.toLowerCase() === qualification.toLowerCase())
    return {
      id: item.id,
      qualification: matchedQualification ?? 'Other',
      course: matchedQualification ? courseParts.join(' — ') : item.degree,
      specialization: item.fieldOfStudy ?? '',
      institution: item.institution,
      graduationYear: item.endYear?.toString() ?? '',
      status: item.endYear ? 'COMPLETED' : 'PURSUING',
      grade: item.grade ?? '',
    }
  })
  return entries.length ? entries : [{
    id: 'education-new',
    qualification: '',
    course: '',
    specialization: '',
    institution: '',
    graduationYear: '',
    status: 'COMPLETED',
    grade: '',
  }]
}

function initialStep(response: CandidateProfileResponse) {
  if (!response.profile.phone || !response.profile.location) return 1
  if (response.profile.education.length === 0) return 2
  if (!response.profile.headline || !response.profile.preferences?.desiredTitles.length) return 3
  return 4
}

export function ResumeOnboardingPage() {
  const navigate = useNavigate()
  const { refreshSession, user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileResponse, setProfileResponse] = useState<CandidateProfileResponse | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [fullName, setFullName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [gender, setGender] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [education, setEducation] = useState<EducationDraft[]>([])
  const [headline, setHeadline] = useState('')
  const [roles, setRoles] = useState<string[]>([])
  const [roleInput, setRoleInput] = useState('')
  const [locations, setLocations] = useState<string[]>([])
  const [locationInput, setLocationInput] = useState('')
  const [workModes, setWorkModes] = useState<string[]>([])
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([])
  const [salaryRange, setSalaryRange] = useState('')
  const [openToWork, setOpenToWork] = useState<'ACTIVELY_LOOKING' | 'NOT_LOOKING'>('ACTIVELY_LOOKING')
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true
    void candidateService.getProfile().then((response) => {
      if (!isActive) return
      const mapped = mapCandidateProfile(response)
      setProfileResponse(response)
      setFullName(mapped.fullName)
      setPhone(mapped.phone)
      setLocation(mapped.location)
      setGender(response.profile.gender ?? '')
      setDateOfBirth(mapped.dateOfBirth)
      setEducation(mapEducation(response))
      setHeadline(mapped.headline)
      setRoles(mapped.preferences.desiredTitles)
      setLocations(mapped.preferences.preferredLocations)
      setWorkModes(mapped.preferences.workModes)
      setEmploymentTypes(mapped.preferences.employmentTypes)
      setOpenToWork(response.profile.openToWork === 'NOT_LOOKING' ? 'NOT_LOOKING' : 'ACTIVELY_LOOKING')
      const selectedSalary = salaryRanges.find(({ min, max }) =>
        mapped.preferences.expectedSalaryMin === min && mapped.preferences.expectedSalaryMax === max)
      setSalaryRange(selectedSalary?.label ?? '')
      setCurrentStep(initialStep(response))
      setIsLoadingProfile(false)
    }).catch(() => {
      if (!isActive) return
      setError('We could not load your saved onboarding details. Please refresh and try again.')
      setIsLoadingProfile(false)
    })
    return () => { isActive = false }
  }, [])

  const addEducation = () => setEducation((items) => [...items, {
    id: `education-${Date.now()}`,
    qualification: '',
    course: '',
    specialization: '',
    institution: '',
    graduationYear: '',
    status: 'COMPLETED',
    grade: '',
  }])

  const updateEducation = (id: string, updates: Partial<EducationDraft>) => {
    setEducation((items) => items.map((item) => item.id === id ? { ...item, ...updates } : item))
  }

  const toggleOption = (values: string[], value: string, update: (next: string[]) => void) => {
    update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }

  const selectFile = (candidateFile?: File) => {
    if (!candidateFile) return
    setError('')
    setUploadSuccess(false)
    const extension = candidateFile.name.split('.').pop()?.toLowerCase() ?? ''
    if (!acceptedExtensions.includes(extension) || (candidateFile.type && !acceptedMimeTypes.includes(candidateFile.type))) {
      setFile(null)
      setError('Please upload a PDF, DOC, or DOCX file.')
      return
    }
    if (candidateFile.size > MAX_FILE_SIZE) {
      setFile(null)
      setError('File size must be 8MB or smaller.')
      return
    }
    setFile(candidateFile)
  }

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => selectFile(event.target.files?.[0])
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragActive(false)
    selectFile(event.dataTransfer.files[0])
  }

  const saveStep = async (step: number) => {
    setError('')
    try {
      if (step === 1) {
        if (!fullName.trim() || !phone.trim() || !location.trim()) {
          setError('Enter your full name, mobile number, and current location to continue.')
          return false
        }
        const updated = await candidateService.saveProfile({
          fullName: fullName.trim(),
          phone: phone.trim(),
          location: location.trim(),
          gender: gender || undefined,
          dateOfBirth: dateOfBirth || null,
        })
        setProfileResponse(updated)
        await refreshSession()
      }
      if (step === 2) {
        const usableEducation = education.filter((item) => item.qualification.trim() && item.institution.trim())
        if (!usableEducation.length) {
          setError('Add your current or highest education and institution to continue.')
          return false
        }
        await candidateService.saveProfile({
          education: usableEducation.map((item) => ({
            degree: [item.qualification.trim(), item.course.trim()].filter(Boolean).join(' — '),
            institution: item.institution.trim(),
            fieldOfStudy: item.specialization.trim() || undefined,
            endYear: item.status === 'COMPLETED' && item.graduationYear ? Number(item.graduationYear) : undefined,
            grade: item.grade.trim() || undefined,
          })),
        })
      }
      if (step === 3) {
        if (!headline.trim() || !roles.length) {
          setError('Add a professional headline and at least one preferred job role to continue.')
          return false
        }
        if (roles.length > 3) {
          setError('You can select up to 3 desired positions.')
          return false
        }
        const range = salaryRanges.find((item) => item.label === salaryRange)
        await candidateService.saveProfile({
          headline: headline.trim(),
          openToWork,
          preferences: {
            desiredTitles: roles,
            preferredLocations: locations,
            workModes,
            employmentTypes,
            preferredIndustries: profileResponse?.profile.preferences?.preferredIndustries ?? [],
            preferredFunctionalAreas: profileResponse?.profile.preferences?.preferredFunctionalAreas ?? [],
            experienceMinYears: profileResponse?.profile.preferences?.experienceMinYears == null ? null : Number(profileResponse.profile.preferences.experienceMinYears),
            experienceMaxYears: profileResponse?.profile.preferences?.experienceMaxYears == null ? null : Number(profileResponse.profile.preferences.experienceMaxYears),
            expectedSalaryMin: range?.min ?? null,
            expectedSalaryMax: range?.max ?? null,
          },
        })
      }
      return true
    } catch (saveError) {
      setError(getUploadError(saveError))
      return false
    }
  }

  const completeOnboarding = async () => {
    if (isCompletingOnboarding) return
    setIsCompletingOnboarding(true)
    setError('')
    try {
      const response = await candidateService.saveProfile({ completeOnboarding: true })
      if (!response.onboardingComplete) {
        throw new Error('Onboarding could not be marked complete. Please try again.')
      }
      const refreshedUser = await refreshSession()
      if (!refreshedUser || refreshedUser.onboardingComplete === false) {
        throw new Error('Your session could not be refreshed. Please try again.')
      }
      navigate('/candidate/profile', { replace: true })
    } catch (completionError) {
      setError(completionError instanceof Error ? completionError.message : 'Could not complete onboarding. Please try again.')
    } finally {
      setIsCompletingOnboarding(false)
    }
  }

  const handleContinue = async () => {
    if (isLoadingProfile || isProcessing) return
    if (currentStep === 4) {
      if (uploadSuccess) {
        setCurrentStep(5)
        return
      }

      if (!file) {
        setError('Choose a resume to continue.')
        return
      }
      setError('')
      setIsProcessing(true)
      setUploadProgress(0)
      try {
        const response = await candidateService.uploadResume(file, setUploadProgress)
        if (!response.success || response.status !== 'parsed' || response.resume.status !== 'PARSED') {
          setError(response.message || "We couldn't extract enough information from this resume. You can upload a clearer version.")
          return
        }
        setUploadSuccess(true)
      } catch (uploadError) {
        setError(getUploadError(uploadError))
      } finally {
        setIsProcessing(false)
      }
      return
    }
    if (currentStep === 5) {
      await completeOnboarding()
      return
    }
    if (await saveStep(currentStep)) setCurrentStep((step) => step + 1)
  }

  const handleBack = () => {
    setError('')
    setCurrentStep((step) => Math.max(1, step - 1))
  }

  const clearFile = () => {
    setFile(null)
    setError('')
    setUploadSuccess(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const addRole = (value: string) => {
    const normalized = value.trim()
    if (!normalized) {
      setRoleInput('')
      return
    }
    if (roles.includes(normalized)) {
      setRoleInput('')
      return
    }
    if (roles.length >= 3) {
      setError('You can select up to 3 desired positions.')
      return
    }
    setRoles((items) => [...items, normalized])
    setRoleInput('')
  }

  const addLocation = (value: string) => {
    const normalized = value.trim()
    if (normalized && !locations.includes(normalized)) setLocations((items) => [...items, normalized])
    setLocationInput('')
  }

  const yearOptions = Array.from({ length: 61 }, (_, index) => new Date().getFullYear() + 5 - index)
  const stepTitles = ['Basic details', 'Education', 'Headline & preferences', 'Resume upload', 'Stand Out to Recruiters']

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8">
          <img src={logoImage} alt="Clyptus" className="h-8 w-auto object-contain" />
          <div className="text-right">
            <p className="text-sm font-semibold">Candidate onboarding</p>
            <p className="text-xs text-slate-500">Step {currentStep} of 5</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-7 sm:px-8 sm:py-10">
        <ol className="mb-7 grid grid-cols-5 gap-2" aria-label="Onboarding progress">
          {stepTitles.map((title, index) => {
            const step = index + 1
            const complete = step < currentStep
            return (
              <li key={title} className="min-w-0">
                <div className={`h-1 rounded-full ${complete || step === currentStep ? 'bg-orange-500' : 'bg-slate-200'}`} />
                <p className={`mt-2 truncate text-[11px] font-medium sm:text-xs ${step === currentStep ? 'text-slate-900' : 'text-slate-500'}`}>
                  {complete ? '✓ ' : `${step}. `}{title}
                </p>
              </li>
            )
          })}
        </ol>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          {isLoadingProfile ? <p className="py-12 text-center text-sm text-slate-600">Loading your saved details...</p> : (
            <>
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-700">Step {currentStep} · {stepTitles[currentStep - 1]}</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {currentStep === 1 ? 'Tell us a little about yourself' : currentStep === 2 ? 'Add your education' : currentStep === 3 ? 'Set your job preferences' : currentStep === 4 ? 'Upload your resume' : '5. Stand Out to Recruiters'}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  {currentStep === 1 ? 'A few essential details help us create your candidate profile.' : currentStep === 2 ? 'Add your highest or current qualification.' : currentStep === 3 ? 'Help us understand the roles and opportunities you want.' : currentStep === 4 ? 'We’ll parse your resume into a draft for you to review before it becomes your profile.' : 'Take an optional AI Video Interview or continue to your profile.'}
                </p>
              </div>

              {currentStep === 1 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm font-medium">Full name <span className="text-red-600">*</span>
                    <input className={inputClass} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">Email
                    <input className={`${inputClass} bg-slate-100 text-slate-500`} value={user?.email ?? profileResponse?.user.email ?? ''} readOnly />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">Mobile number <span className="text-red-600">*</span>
                    <input className={inputClass} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" required />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">Current location <span className="text-red-600">*</span>
                    <input className={inputClass} list="candidate-locations" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Search or enter a city" required />
                    <datalist id="candidate-locations">{locationOptions.filter((item) => item !== 'Remote').map((item) => <option key={item} value={item} />)}</datalist>
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">Date of birth
                    <input className={inputClass} type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} max={new Date().toISOString().slice(0, 10)} />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">Gender <span className="font-normal text-slate-500">(optional)</span>
                    <select className={selectClass} value={gender} onChange={(event) => setGender(event.target.value)}>
                      <option value="">Prefer not to say</option>
                      <option value="WOMAN">Woman</option>
                      <option value="MAN">Man</option>
                      <option value="NON_BINARY">Non-binary</option>
                      <option value="SELF_DESCRIBED">Self-described</option>
                      <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    </select>
                  </label>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="space-y-4">
                  {education.map((item, index) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Education {index + 1}</h2>
                        {education.length > 1 ? <button type="button" onClick={() => setEducation((items) => items.filter((entry) => entry.id !== item.id))} className="text-xs font-medium text-red-700 hover:underline">Remove</button> : null}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1 text-xs font-medium text-slate-700">Highest qualification
                          <select className={selectClass} value={item.qualification} onChange={(event) => updateEducation(item.id, { qualification: event.target.value })}>
                            <option value="">Select qualification</option>
                            {['10th', '12th', 'Diploma', "Bachelor's Degree", "Master's Degree", 'M.Tech', 'MCA', 'MBA', 'PhD', 'Other'].map((value) => <option key={value}>{value}</option>)}
                          </select>
                        </label>
                        <label className="space-y-1 text-xs font-medium text-slate-700">Degree / course
                          <input className={inputClass} value={item.course} onChange={(event) => updateEducation(item.id, { course: event.target.value })} placeholder="e.g. Computer Science" />
                        </label>
                        <label className="space-y-1 text-xs font-medium text-slate-700">Specialization / field of study
                          <input className={inputClass} value={item.specialization} onChange={(event) => updateEducation(item.id, { specialization: event.target.value })} placeholder="e.g. Artificial Intelligence" />
                        </label>
                        <label className="space-y-1 text-xs font-medium text-slate-700">College / university
                          <input className={inputClass} value={item.institution} onChange={(event) => updateEducation(item.id, { institution: event.target.value })} required />
                        </label>
                        <label className="space-y-1 text-xs font-medium text-slate-700">Education status
                          <select className={selectClass} value={item.status} onChange={(event) => updateEducation(item.id, { status: event.target.value as EducationDraft['status'] })}>
                            <option value="COMPLETED">Completed</option><option value="PURSUING">Pursuing</option>
                          </select>
                        </label>
                        {item.status === 'COMPLETED' ? (
                          <label className="space-y-1 text-xs font-medium text-slate-700">Graduation year
                            <select className={selectClass} value={item.graduationYear} onChange={(event) => updateEducation(item.id, { graduationYear: event.target.value })}>
                              <option value="">Select year</option>{yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                            </select>
                          </label>
                        ) : null}
                        <label className="space-y-1 text-xs font-medium text-slate-700 sm:col-span-2">Grade / CGPA <span className="font-normal text-slate-500">(optional)</span>
                          <input className={inputClass} value={item.grade} onChange={(event) => updateEducation(item.id, { grade: event.target.value })} placeholder="e.g. 8.2 CGPA" />
                        </label>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addEducation} className="rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-orange-400 hover:text-orange-700">+ Add another education</button>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="space-y-5">
                  <label className="block space-y-1.5 text-sm font-medium">Professional headline <span className="text-red-600">*</span>
                    <input className={inputClass} value={headline} onChange={(event) => setHeadline(event.target.value)} placeholder="AI/ML Engineer | Python | Machine Learning" maxLength={160} required />
                  </label>
                  <div>
                    <label htmlFor="role-search" className="text-sm font-medium">Preferred job roles <span className="text-red-600">*</span></label>
                    <div className="mt-1.5 flex gap-2">
                      <input id="role-search" className={inputClass} list="candidate-roles" value={roleInput} onChange={(event) => setRoleInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addRole(roleInput) } }} placeholder="Search or add a role" disabled={roles.length >= 3} />
                      <datalist id="candidate-roles">{roleOptions.map((item) => <option key={item} value={item} />)}</datalist>
                      <button type="button" onClick={() => addRole(roleInput)} disabled={roles.length >= 3} className="rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Add</button>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                      <span>{roles.length}/3 selected</span>
                      {roles.length >= 3 ? <span className="font-medium text-orange-700">You can select up to 3 desired positions.</span> : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {roles.map((role) => <button type="button" key={role} onClick={() => setRoles((items) => items.filter((item) => item !== role))} className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-900">{role} <span aria-hidden="true">×</span></button>)}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="location-search" className="text-sm font-medium">Preferred locations</label>
                    <div className="mt-1.5 flex gap-2">
                      <input id="location-search" className={inputClass} list="preferred-locations" value={locationInput} onChange={(event) => setLocationInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addLocation(locationInput) } }} placeholder="Search or add a location" />
                      <datalist id="preferred-locations">{locationOptions.map((item) => <option key={item} value={item} />)}</datalist>
                      <button type="button" onClick={() => addLocation(locationInput)} className="rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700">Add</button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {locations.map((place) => <button type="button" key={place} onClick={() => setLocations((items) => items.filter((item) => item !== place))} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-800">{place} <span aria-hidden="true">×</span></button>)}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <fieldset>
                      <legend className="text-sm font-medium">Work mode</legend>
                      <div className="mt-2 flex flex-wrap gap-2">{[['ONSITE', 'On-site'], ['HYBRID', 'Hybrid'], ['REMOTE', 'Remote']].map(([value, label]) => (
                        <label key={value} className={`cursor-pointer rounded-full border px-3 py-2 text-xs font-medium ${workModes.includes(value) ? 'border-orange-400 bg-orange-50 text-orange-900' : 'border-slate-200 text-slate-700'}`}>
                          <input className="sr-only" type="checkbox" checked={workModes.includes(value)} onChange={() => toggleOption(workModes, value, setWorkModes)} />{label}
                        </label>
                      ))}</div>
                    </fieldset>
                    <fieldset>
                      <legend className="text-sm font-medium">Employment type</legend>
                      <div className="mt-2 flex flex-wrap gap-2">{[['FULL_TIME', 'Full-time'], ['PART_TIME', 'Part-time'], ['INTERNSHIP', 'Internship'], ['CONTRACT', 'Contract']].map(([value, label]) => (
                        <label key={value} className={`cursor-pointer rounded-full border px-3 py-2 text-xs font-medium ${employmentTypes.includes(value) ? 'border-orange-400 bg-orange-50 text-orange-900' : 'border-slate-200 text-slate-700'}`}>
                          <input className="sr-only" type="checkbox" checked={employmentTypes.includes(value)} onChange={() => toggleOption(employmentTypes, value, setEmploymentTypes)} />{label}
                        </label>
                      ))}</div>
                    </fieldset>
                    <label className="space-y-1.5 text-sm font-medium">Expected salary range
                      <select className={selectClass} value={salaryRange} onChange={(event) => setSalaryRange(event.target.value)}>
                        <option value="">Select a range</option>{salaryRanges.map((item) => <option key={item.label}>{item.label}</option>)}
                      </select>
                    </label>
                    <fieldset>
                      <legend className="text-sm font-medium">Open to work</legend>
                      <div className="mt-2 flex gap-4 text-sm">
                        <label className="inline-flex items-center gap-2"><input type="radio" name="openToWork" checked={openToWork === 'ACTIVELY_LOOKING'} onChange={() => setOpenToWork('ACTIVELY_LOOKING')} />Actively looking</label>
                        <label className="inline-flex items-center gap-2"><input type="radio" name="openToWork" checked={openToWork === 'NOT_LOOKING'} onChange={() => setOpenToWork('NOT_LOOKING')} />Not looking</label>
                      </div>
                    </fieldset>
                  </div>
                </div>
              ) : null}

              {currentStep === 4 ? (
                <div>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onFileInput} className="hidden" />
                  {!file ? (
                    <div onDragOver={(event) => { event.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDrop={onDrop} className={`flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed px-5 py-8 text-center transition ${dragActive ? 'border-orange-400 bg-orange-50' : 'border-slate-300 bg-slate-50'}`}>
                      <UploadCloud className="h-8 w-8 text-orange-700" />
                      <p className="mt-3 text-sm font-semibold">Upload your latest resume</p>
                      <p className="mt-1 text-xs text-slate-600">PDF, DOC, DOCX · Maximum 8 MB</p>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Choose resume</button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 shrink-0 text-orange-700" />
                        <div className="min-w-0 flex-1"><p className="break-all text-sm font-semibold">{file.name}</p><p className="mt-1 text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</p></div>
                        {!isProcessing ? <button type="button" onClick={clearFile} aria-label="Remove selected resume" className="rounded-md p-2 text-slate-500 hover:bg-white"><X className="h-4 w-4" /></button> : null}
                      </div>
                      {isProcessing ? <div className="mt-4"><div className="flex items-center gap-2 text-sm text-slate-700"><LoaderCircle className="h-4 w-4 animate-spin" />Uploading and parsing resume ({uploadProgress}%)</div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-orange-500 transition-all" style={{ width: `${uploadProgress}%` }} /></div></div> : null}
                      {uploadSuccess && !isProcessing ? <div className="mt-4 flex items-center gap-2 text-sm font-medium text-green-700"><CheckCircle2 className="h-4 w-4" />Resume uploaded and parsed successfully!</div> : null}
                    </div>
                  )}
                  <p className="mt-4 text-sm leading-6 text-slate-600">After parsing, your information is shown as a draft. It will not replace your profile until you review and confirm it.</p>
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-700">We’ll look for</p>
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                      {['Skills', 'Education', 'Experience', 'Projects'].map((item) => <li key={item}>· {item}</li>)}
                    </ul>
                  </div>
                </div>
              ) : null}

              {currentStep === 5 ? (
                <div className="space-y-4">
                  <StandOutSection onboarding onSkip={() => void completeOnboarding()} onComplete={() => void completeOnboarding()} />
                </div>
              ) : null}

              {error ? <p role="alert" className="mt-5 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p> : null}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {currentStep > 1 ? (
                    <button type="button" onClick={handleBack} disabled={isProcessing} className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><ChevronLeft className="h-4 w-4" />Back</button>
                  ) : <span />}
                </div>
                <button
                  type="button"
                  onClick={() => void handleContinue()}
                  disabled={isLoadingProfile || isProcessing || isCompletingOnboarding || (currentStep === 4 && !file)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCompletingOnboarding ? <><LoaderCircle className="h-4 w-4 animate-spin" />Opening profile</> : isProcessing ? <><LoaderCircle className="h-4 w-4 animate-spin" />Processing</> : currentStep === 4 ? (uploadSuccess ? <>Next <ChevronRight className="h-4 w-4" /></> : <>Upload & process resume <ChevronRight className="h-4 w-4" /></>) : currentStep === 5 ? <>Go to Profile <ChevronRight className="h-4 w-4" /></> : <>Continue <ChevronRight className="h-4 w-4" /></>}
                </button>
              </div>
            </>
          )}
        </section>
        <p className="mt-4 text-center text-xs text-slate-500">Signed in as {user?.email || 'your candidate account'}</p>
      </div>
    </main>
  )
}
