import { useEffect, useMemo, useState } from 'react'
import { savedJobService, type SavedJob } from '../services/savedJobService'

export function useSavedJobs() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingJobIds, setSavingJobIds] = useState<Set<string>>(() => new Set())
  const [retry, setRetry] = useState(0)
  const savedJobIds = useMemo(() => new Set(savedJobs.map((job) => job.id)), [savedJobs])

  useEffect(() => {
    let active = true
    void savedJobService.listSavedJobs().then((response) => {
      if (!active) return
      setSavedJobs(response.items)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setError('Saved jobs could not be loaded. Please try again.')
      setLoading(false)
    })
    return () => { active = false }
  }, [retry])

  const toggleSavedJob = async (jobId: string) => {
    setSavingJobIds((current) => new Set(current).add(jobId))
    setError('')
    try {
      if (savedJobIds.has(jobId)) {
        await savedJobService.removeSavedJob(jobId)
        setSavedJobs((current) => current.filter((job) => job.id !== jobId))
      } else {
        const savedJob = await savedJobService.saveJob(jobId)
        setSavedJobs((current) => current.some((job) => job.id === jobId) ? current : [savedJob, ...current])
      }
    } catch {
      setError('We could not update your saved jobs. Please try again.')
    } finally {
      setSavingJobIds((current) => {
        const next = new Set(current)
        next.delete(jobId)
        return next
      })
    }
  }

  const retryLoading = () => {
    setLoading(true)
    setError('')
    setRetry((value) => value + 1)
  }

  return {
    savedJobs,
    savedJobIds,
    loading,
    error,
    savingJobIds,
    toggleSavedJob,
    retryLoading,
  }
}
