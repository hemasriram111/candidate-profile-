import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import {
  Camera,
  Check,
  ChevronRight,
  CirclePlay,
  Mic,
  Sparkles,
  Trash2,
  UploadCloud,
  Video,
  X,
} from 'lucide-react'
import { useAuth } from '../common/AuthContext'
import { Button } from '../ui/button'

export type CandidateEnhancementType = 'none' | 'video_profile' | 'ai_interview'

export type StandOutState = {
  candidateEnhancement: CandidateEnhancementType
  videoProfile: {
    status: 'none' | 'processing' | 'completed'
    duration: number
    videoUrl: string | null
    createdAt: string | null
    displayName: string | null
  }
  aiInterview: {
    status: 'none' | 'preparing' | 'in_progress' | 'processing' | 'completed'
    duration: number
    score: number | null
    submittedAt: string | null
    deleteAllowedAt: string | null
    videoUrl: string | null
  }
}

const STORAGE_KEY_PREFIX = 'clyptus_standout'


const defaultState: StandOutState = {
  candidateEnhancement: 'none',
  videoProfile: {
    status: 'none',
    duration: 0,
    videoUrl: null,
    createdAt: null,
    displayName: null,
  },
  aiInterview: {
    status: 'none',
    duration: 15 * 60,
    score: null,
    submittedAt: null,
    deleteAllowedAt: null,
    videoUrl: null,
  },
}

function getStorageKey(userId?: string | null) {
  const safeUserId = (userId ?? '').trim()
  return safeUserId ? `${STORAGE_KEY_PREFIX}_${safeUserId}` : `${STORAGE_KEY_PREFIX}_anonymous`
}

function readState(userId?: string | null): StandOutState {
  if (typeof window === 'undefined') return defaultState
  try {
    const raw = window.localStorage.getItem(getStorageKey(userId))
    if (!raw) return defaultState
    const parsed = JSON.parse(raw) as Partial<StandOutState>
    return {
      candidateEnhancement: parsed.candidateEnhancement ?? defaultState.candidateEnhancement,
      videoProfile: {
        ...defaultState.videoProfile,
        ...parsed.videoProfile,
      },
      aiInterview: {
        ...defaultState.aiInterview,
        ...parsed.aiInterview,
      },
    }
  } catch {
    return defaultState
  }
}

function formatSeconds(value: number) {
  const totalSeconds = Math.max(0, Math.round(value))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function formatDurationLabel(value: number) {
  if (!value) return '00:00'
  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}





function getVideoDuration(file: File) {
  return new Promise<number | null>((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null)
      return
    }
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      resolve(Number.isFinite(video.duration) ? video.duration : null)
      URL.revokeObjectURL(url)
    }
    video.onerror = () => {
      resolve(null)
      URL.revokeObjectURL(url)
    }
    video.src = url
  })
}

type StandOutSectionProps = {
  onboarding?: boolean
  onSkip?: () => void
  onComplete?: () => void
}

export function StandOutSection({ onboarding = false, onSkip, onComplete }: StandOutSectionProps) {
  const { user } = useAuth()
  const [userId, setUserId] = useState<string | null>(user?.id ?? null)
  const [state, setState] = useState<StandOutState>(() => readState(user?.id ?? null))
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [aiPrepOpen, setAiPrepOpen] = useState(false)
  const [videoError, setVideoError] = useState('')
  const [videoProcessing, setVideoProcessing] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isMockRecording, setIsMockRecording] = useState(false)
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null)
  const [cameraPermissionError, setCameraPermissionError] = useState('')
  const [fileInputKey, setFileInputKey] = useState(0)
  const [pendingVideoMeta, setPendingVideoMeta] = useState<{ url: string; duration: number; name: string } | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recordingTimerRef = useRef<number | null>(null)
  const completionTimerRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(state))
  }, [state, userId])

  useEffect(() => {
    const nextUserId = user?.id ?? null
    setUserId(nextUserId)
    setState(readState(nextUserId))
  }, [user?.id])



  useEffect(() => {
    if (!recording) return
    recordingTimerRef.current = window.setInterval(() => setRecordingTime((value) => value + 1), 1000)
    return () => {
      if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current)
    }
  }, [recording])

  useEffect(() => {
    if (recording && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [recording])

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl)
      if (pendingVideoMeta) URL.revokeObjectURL(pendingVideoMeta.url)
      if (completionTimerRef.current) window.clearInterval(completionTimerRef.current)
    }
  }, [])

  const activeVideo = !onboarding && state.videoProfile.status === 'completed'

  const resetVideoModal = () => {
    setVideoModalOpen(false)
    setVideoError('')
    setVideoProcessing(false)
    setRecording(false)
    setRecordingTime(0)
    setRecordedVideoUrl(null)
    setPendingVideoMeta(null)
    setCameraPermissionError('')
    setIsMockRecording(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (mediaRecorderRef.current) mediaRecorderRef.current = null
    if (fileInputRef.current) fileInputRef.current.value = ''
    setFileInputKey((value) => value + 1)
  }

  const openVideoModalFlow = () => {
    setVideoModalOpen(true)
    setVideoError('')
  }

  const openAiPrepFlow = () => {
    if (activeVideo) return
    setAiPrepOpen(true)
  }

  const saveMockVideo = (url: string, duration: number, name: string) => {
    const submittedAt = new Date().toISOString()
    setState((current) => ({
      ...current,
      candidateEnhancement: 'video_profile',
      videoProfile: {
        status: 'completed',
        duration,
        videoUrl: url,
        createdAt: submittedAt,
        displayName: name,
      },
      aiInterview: {
        ...current.aiInterview,
        ...(current.candidateEnhancement === 'ai_interview' ? { status: 'none', score: null, submittedAt: null, deleteAllowedAt: null, videoUrl: null } : {}),
      },
    }))
    setVideoProcessing(false)
    setVideoModalOpen(false)
    setPendingVideoMeta(null)
    if (onComplete && onboarding) onComplete()
  }

  const handleUploadSelection = async (file?: File) => {
    if (!file) return
    const mimeAllowed = file.type === 'video/mp4' || file.type === 'video/webm' || file.name.toLowerCase().endsWith('.mp4')
    if (!mimeAllowed) {
      setVideoError('Please upload an MP4 video file.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setVideoError('Please upload a video smaller than 20MB.')
      return
    }

    setVideoError('')
    setVideoProcessing(true)
    const detectedDuration = await getVideoDuration(file)
    if (detectedDuration && detectedDuration < 30) {
      setVideoError('Your video must be at least 30 seconds long.')
      setVideoProcessing(false)
      return
    }
    if (detectedDuration && detectedDuration > 180) {
      setVideoError('Your video must be shorter than 3 minutes.')
      setVideoProcessing(false)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPendingVideoMeta({ url: objectUrl, duration: detectedDuration ?? 75, name: file.name })
    setVideoProcessing(false)
    const safeDuration = detectedDuration ?? 75
    saveMockVideo(objectUrl, safeDuration, file.name)
  }

  const startRecording = async () => {
    if (!('MediaRecorder' in window) || !navigator.mediaDevices?.getUserMedia) {
      setIsMockRecording(true)
      setPendingVideoMeta({
        url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        duration: 92,
        name: 'Mock video profile.mp4',
      })
      setRecordedVideoUrl('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4')
      setCameraPermissionError('')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      const videoElement = videoRef.current
      if (videoElement) {
        videoElement.srcObject = stream
        videoElement.muted = true
        videoElement.play().catch(() => undefined)
      }
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        if (!blob.size) {
          setCameraPermissionError('No recording was captured. Please try again.')
          return
        }
        const url = URL.createObjectURL(blob)
        setRecordedVideoUrl(url)
        setPendingVideoMeta({ url, duration: Math.max(30, recordingTime || 62), name: 'Recorded introduction.webm' })
        setRecording(false)
        setCameraPermissionError('')
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
      setCameraPermissionError('')
      setRecordedVideoUrl(null)
      setPendingVideoMeta(null)
      setRecordingTime(0)
    } catch {
      setCameraPermissionError('Camera and microphone access is blocked. You can still upload a video file.')
      setIsMockRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setRecording(false)
    setCameraPermissionError('')
  }

  const usePendingVideo = () => {
    if (!pendingVideoMeta) return
    saveMockVideo(pendingVideoMeta.url, pendingVideoMeta.duration, pendingVideoMeta.name)
  }





  const toggleVideoDelete = () => {
    setState((current) => ({
      ...current,
      candidateEnhancement: current.candidateEnhancement === 'video_profile' ? 'none' : current.candidateEnhancement,
      videoProfile: {
        ...defaultState.videoProfile,
      },
    }))
  }

  const showVideoPreview = activeVideo || !!pendingVideoMeta || !!recordedVideoUrl

  return (
    <section className="space-y-5">
      {onboarding ? (
        <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="eyebrow">Step 5 · Stand Out to Recruiters</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">AI Video Interview</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Choose whether to try the AI Video Interview or continue to your profile.</p>
        </div>
      ) : null}

      {!activeVideo ? (
        <div className="flex flex-col sm:flex-row gap-4">
          {!onboarding ? (
            <button
              type="button"
              onClick={openVideoModalFlow}
              className="flex-1 group relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-left shadow-md transition hover:from-orange-600 hover:to-orange-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur-sm"><Video className="h-5 w-5" /></div>
                  <div>
                    <h3 className="text-sm font-bold tracking-wide text-white uppercase">Video Profile</h3>
                    <p className="mt-0.5 text-xs text-orange-100">Introduce yourself to recruiters</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/70 transition-transform group-hover:translate-x-1 group-hover:text-white" />
              </div>
            </button>
          ) : null}

          <button
            type="button"
            onClick={openAiPrepFlow}
            className="flex-1 group relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 text-left shadow-md transition hover:from-slate-900 hover:to-slate-950 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur-sm"><Sparkles className="h-5 w-5 text-blue-200" /></div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide text-white uppercase">AI Video Interview</h3>
                  <p className="mt-0.5 text-xs text-slate-300">Take a personalized interview</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/50 transition-transform group-hover:translate-x-1 group-hover:text-white" />
            </div>
          </button>
        </div>
      ) : null}

      {activeVideo ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><Check className="h-4 w-4" /> Video Profile Added</div>
              <p className="mt-1 text-sm text-emerald-800">Your video introduction is live and visible when recruiters view your profile.</p>
            </div>
            <div className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Live</div>
          </div>

          <div className="mt-4 flex justify-center">
            <div className="mx-auto w-full max-w-[280px] sm:max-w-[320px] aspect-square overflow-hidden rounded-[20px] bg-slate-900 border border-emerald-200 shadow-sm">
              {showVideoPreview ? (
                <video
                  ref={videoRef}
                  src={state.videoProfile.videoUrl ?? (pendingVideoMeta?.url ?? recordedVideoUrl ?? undefined)}
                  controls
                  className="h-full w-full object-cover"
                  preload="metadata"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-600">No video preview available yet</div>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white p-3">
            <span className="text-sm font-medium text-slate-700">Duration: {formatDurationLabel(state.videoProfile.duration)}</span>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1.5"><CirclePlay className="h-3.5 w-3.5" />Watch</Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={openVideoModalFlow}><Camera className="h-3.5 w-3.5" />Replace</Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5 text-red-700" onClick={toggleVideoDelete}><Trash2 className="h-3.5 w-3.5" />Delete</Button>
            </div>
          </div>
        </div>
      ) : null}



      {onboarding ? (
        <div className="flex justify-end gap-3 border-t border-[var(--color-border)] pt-4">
          <Button type="button" variant="outline" onClick={() => onSkip?.()}>Skip for now</Button>
        </div>
      ) : null}

      {videoModalOpen && !onboarding ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Video Profile</p>
                <h3 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">Create Your Video Profile</h3>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Introduce yourself to recruiters in your own words.</p>
              </div>
              <button type="button" onClick={resetVideoModal} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-slate-50 p-4 text-sm text-slate-700">
              <span className="font-semibold text-[var(--color-text)]">Duration:</span> 30 seconds – 3 minutes
            </div>

            {!recording && !pendingVideoMeta && !recordedVideoUrl && !videoProcessing ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={startRecording} className="rounded-2xl border border-[var(--color-border)] bg-slate-900 p-4 text-left text-white transition hover:bg-slate-800">
                  <div className="flex items-center gap-3"><Camera className="h-5 w-5" /> <span className="font-semibold">Record Video</span></div>
                </button>
                <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-slate-50 p-4 text-left font-semibold text-slate-700 transition hover:border-orange-400 hover:text-orange-700">
                  <input key={fileInputKey} type="file" accept="video/mp4,.mp4" className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => void handleUploadSelection(event.target.files?.[0])} />
                  <span className="inline-flex items-center gap-2"><UploadCloud className="h-5 w-5" />Upload Video</span>
                </label>
              </div>
            ) : null}

            {videoProcessing ? (
              <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                Uploading and validating your video…
              </div>
            ) : null}

            {cameraPermissionError ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{cameraPermissionError}</div>
            ) : null}

            {videoError ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{videoError}</div>
            ) : null}

            {recording ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500" /> Recording</div>
                  <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-800">{formatSeconds(recordingTime)}</div>
                </div>
                <div className="mt-4 flex justify-center">
                  <div className="mx-auto w-full max-w-[280px] sm:max-w-[320px] aspect-square overflow-hidden rounded-[20px] bg-slate-900 shadow-inner">
                    <video ref={videoRef} className="h-full w-full object-cover" muted playsInline autoPlay />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <div className="inline-flex items-center gap-2"><Mic className="h-4 w-4" />Microphone on</div>
                  <div className="inline-flex items-center gap-2"><Camera className="h-4 w-4" />Camera live</div>
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={stopRecording}>Stop Recording</Button>
                </div>
              </div>
            ) : null}

            {recordedVideoUrl && !pendingVideoMeta ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex justify-center">
                  <div className="mx-auto w-full max-w-[280px] sm:max-w-[320px] aspect-square overflow-hidden rounded-[20px] bg-slate-900 shadow-sm">
                    <video src={recordedVideoUrl} controls className="h-full w-full object-cover" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">Duration: {formatSeconds(recordingTime || 62)}</span>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setRecordedVideoUrl(null)
                      setRecordingTime(0)
                      startRecording()
                    }}>Retake</Button>
                    <Button type="button" onClick={() => {
                      if (recordedVideoUrl) {
                        saveMockVideo(recordedVideoUrl, recordingTime || 62, 'Recorded introduction.webm')
                      }
                    }}>Use this video</Button>
                  </div>
                </div>
              </div>
            ) : null}

            {pendingVideoMeta ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex justify-center">
                  <div className="mx-auto w-full max-w-[280px] sm:max-w-[320px] aspect-square overflow-hidden rounded-[20px] bg-slate-900 shadow-sm">
                    <video src={pendingVideoMeta.url} controls className="h-full w-full object-cover" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">Duration: {formatSeconds(pendingVideoMeta.duration)}</span>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      URL.revokeObjectURL(pendingVideoMeta.url)
                      setPendingVideoMeta(null)
                      setVideoModalOpen(true)
                    }}>Retake</Button>
                    <Button type="button" onClick={usePendingVideo}>Use this video</Button>
                  </div>
                </div>
              </div>
            ) : null}

            {isMockRecording ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Browser recording isn’t supported in this environment, so we’ve prepared a mock recording flow. You can continue with a sample video preview for the front-end experience.
                <div className="mt-4 flex justify-end">
                  <Button type="button" onClick={() => {
                    setIsMockRecording(false)
                    saveMockVideo('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 92, 'Mock profile video.mp4')
                  }}>Continue with mock video</Button>
                </div>
              </div>
            ) : null}

            {!recording && !pendingVideoMeta && !recordedVideoUrl && !videoProcessing && !cameraPermissionError && !isMockRecording ? (
              <div className="mt-6 flex justify-end">
                <Button type="button" variant="outline" onClick={resetVideoModal}>Skip for now</Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {aiPrepOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-[var(--color-text)]">AI Video Interview</h3>
              </div>
              <button type="button" onClick={() => setAiPrepOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            
            <div className="mt-4 text-sm text-slate-600">
              <p>Your AI interview experience will be available here.</p>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={() => setAiPrepOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      ) : null}


    </section>
  )
}
