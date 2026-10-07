import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { FileText, RefreshCw, UploadCloud } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { CandidateEmptyState } from '../../components/candidate/CandidateEmptyState'
import { candidateService, type CandidateProfileResponse } from '../../services/candidateService'

const MAX_RESUME_SIZE = 8 * 1024 * 1024
const ACCEPTED_RESUME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function formatFileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function CandidateResumePage() {
  const [profile, setProfile] = useState<CandidateProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    void candidateService.getProfile().then((result) => {
      if (!active) return
      setProfile(result)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setError('We could not load your resume details.')
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setNotice('')
    if (!ACCEPTED_RESUME_TYPES.has(file.type)) {
      setError('Choose a PDF, DOC, or DOCX resume.')
      event.target.value = ''
      return
    }
    if (file.size > MAX_RESUME_SIZE) {
      setError('Your resume must be 8 MB or smaller.')
      event.target.value = ''
      return
    }
    setUploading(true)
    setProgress(0)
    try {
      const result = await candidateService.uploadResume(file, setProgress)
      const refreshedProfile = await candidateService.getProfile()
      setProfile(refreshedProfile)
      if (result.status === 'parsed') {
        setNotice('Resume replaced. Your profile has not been changed; review any extracted draft before choosing to save profile changes.')
      } else {
        setError(result.message || 'We could not read this resume. Please try another file.')
      }
    } catch (uploadError) {
      const responseData = typeof uploadError === 'object' && uploadError !== null && 'response' in uploadError
        ? (uploadError as { response?: { data?: { message?: string | string[] } } }).response?.data
        : undefined
      const message = responseData?.message
      setError(Array.isArray(message) ? message.join(' ') : message || 'We could not upload your resume. Please try again.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading resume…</div>
  if (error && !profile) return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>
  if (!profile) return <CandidateEmptyState title="Resume details are unavailable" description="Return to your profile and try again." />

  const resume = profile.latestResume

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className="eyebrow">Career materials</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Your resume</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Keep the document you share with employers current. Replacing it does not automatically change your saved profile.</p>
      </header>

      {notice ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p> : null}
      {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-800"><FileText className="h-5 w-5" /></span>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-950">Current resume</h2>
              {resume ? (
                <>
                  <p className="mt-1 break-all text-sm text-slate-700">{resume.originalFileName}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatFileSize(resume.fileSize)} · Uploaded {new Date(resume.createdAt).toLocaleDateString()}</p>
                </>
              ) : <p className="mt-1 text-sm text-slate-500">No parsed resume is available yet.</p>}
            </div>
          </div>
          {resume ? <a href={candidateService.getResumeUrl()} target="_blank" rel="noreferrer" className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50">View resume</a> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950">{resume ? 'Replace resume' : 'Upload a resume'}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">PDF, DOC, or DOCX · Maximum 8 MB. Resume parsing creates a reviewable draft; it does not overwrite your profile fields.</p>
        <input ref={fileInput} type="file" accept=".pdf,.doc,.docx" onChange={(event) => void handleUpload(event)} className="sr-only" aria-label="Choose resume file" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" disabled={uploading} onClick={() => fileInput.current?.click()}><UploadCloud className="mr-2 h-4 w-4" />{uploading ? `Uploading ${progress}%` : resume ? 'Choose replacement' : 'Choose file'}</Button>
          {uploading ? <Button type="button" variant="outline" disabled><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Processing</Button> : null}
        </div>
        {uploading ? <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full bg-orange-600 transition-[width]" style={{ width: `${progress}%` }} /></div> : null}
        {profile.profile.resumeDraftPendingReview ? <p className="mt-4 rounded-xl bg-orange-50 p-3 text-sm text-orange-950">A parsed resume draft is ready for review. <Link to="/candidate/profile" className="font-semibold underline">Review profile draft</Link></p> : null}
      </section>
    </div>
  )
}
